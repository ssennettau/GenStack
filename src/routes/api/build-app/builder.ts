// Core node modules
import fs from 'fs';
import path from 'path';
import os from 'os';

// Utilities
import { createRequire } from 'module';
import { promisify } from 'util';
const require = createRequire(import.meta.url);
const writeFile = promisify(fs.writeFile);

// Third-party modules
import archiver from 'archiver';
import fse from 'fs-extra';

// Environmental Status
import { dev } from '$app/environment';
const checkLambda = !!process.env.LAMBDA_TASK_ROOT;

// PowerTools for AWS Lambda
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { Logger } from '@aws-lambda-powertools/logger';
const metrics = new Metrics({
  namespace: "GenStack-experimental",
  serviceName: "builder",
  defaultDimensions: {
    environment: dev ? "development" : "production"
  }
});
const logger = new Logger({
  serviceName: "/GenStack-experimental/builder",
})

// SST won't bundle the templates, so in Prod it relies on a Lambda Layer to host the templates.
const baseTemplateDir = checkLambda ? "/opt/templates" : "./src/templateLayer/templates";

export async function buildGenStackApp(request: AppRequest) {
  console.log("Parsing request...");
  const requestId = crypto.randomUUID();
  console.debug({
    requestId: requestId,
    requestBody: request
  });

  const appUsername = request.url.split('/')[4];
  const appId = request.url.split('/')[5];
  const appName = request.url.split('/')[6];

  let response: any;
  let tempPath: string = "";

  try {
    response = await getAppDetails(appId, appUsername);

    // For use in testing to prevent PartyRock's WAF from screaming
    //response = require('./sampleDefinition.json');
  } catch (error) {
    console.error(error);
    return generateError(requestId, request, "FailureGetAppDetails");
  }

  try {
    console.debug(baseTemplateDir);
    tempPath = await createTempDir(appId);
    await loadTemplateFiles(tempPath);
    await loadDefinitionFile(tempPath, response);
  } catch (err) {
    console.error(err);
    return generateError(requestId, request, "FailureLoadTemplateFiles");
  }

  try {
    await updateReadme(tempPath, appName);

    if (request.optStylesheet) await addStylesheet(tempPath);
    if (request.optSst) await addSST(tempPath, appName);

    await updatePackageJson(tempPath, request);
  } catch (err) {
    console.error(err);
    return generateError(requestId, request, "FailureUpdateDynamics");
  }

  try {
    const zipFilePath = await createZipArchive(tempPath);
    const zipFileContents = await readZipArchive(zipFilePath);

    metrics.addMetric("BuildSuccess", MetricUnits.Count, 1);
    metrics.publishStoredMetrics();

    logger.info("Build Success", {
      requestId: requestId,
      environment: dev ? "development" : "production",
      url: request.url,
      options: {
        stylesheet: request.optStylesheet,
        sst: request.optSst,
      }
    });

    return {
      status: true,
      body: {
        id: requestId,
        contents: zipFileContents,
      },
    };
  } catch (err) {
    console.error(err);
    return generateError(requestId, request, "FailureBuildZipArchive");
  }
}

async function getAppDetails(appId: string, appUsername: string) {
  console.log("Getting app details...");
  const targetBaseUrl = "https://partyrock.aws/api/getLatestAppVersion";
  const targetParameters = {
    appId: appId,
    username: appUsername,
  };

  let targetUrl = `${targetBaseUrl}?input=${encodeURIComponent(JSON.stringify(targetParameters))}`;
  console.log(targetUrl);

  const request = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 Chrome/119.0.0.0 Safari/537.36',
    }
  });

  if (request.status == 200) {
    const appData = await request.json();
    console.debug(appData);

    return appData;
  }

  else if (request.status == 202) {
    console.error("WAF Triggered - Request Failure");
    throw new Error("FailureWAF");
  }

  else {
    console.error("Request Failure - General (other)");
    console.debug(request);
    throw new Error("FailureGeneral" + request.status);
  }
}

async function createTempDir(appId: string) {
  console.log("Building temp directory");
  const mkdtemp = promisify(fs.mkdtemp);

  const tempDirPrefix = 'app-';

  try {
    const tempDirPath = await mkdtemp(path.join(os.tmpdir(), (tempDirPrefix + appId)));
    console.debug(tempDirPath);

    return tempDirPath;
  } catch (error) {
    throw error;
  }
}

async function loadTemplateFiles(tempPath: string) {
  console.log("Loading the standard template...");
  const primaryTemplateDir = `${baseTemplateDir}/primary`;

  // Copy files from template to temporary path
  try {
    await fse.copy(primaryTemplateDir, tempPath);
    console.log("Copy template completed");
    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function loadDefinitionFile(tempPath: string, definition: any) {
  console.log("Loading the definition file...");
  const definitionFilePath = path.join(tempPath, 'src', 'lib', 'stores', 'definition.json');

  try {
    await writeFile(definitionFilePath, JSON.stringify(definition));
    console.log("Write definition file completed");
    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function updateReadme(tempPath: string, appName: string) {
  const readmeFile = path.join(tempPath, 'README.md');

  try {
    const readmeContents = await fs.promises.readFile(readmeFile, 'utf8');
    const updatedContents = readmeContents.replace(/\[APPNAME\]/g, appName);
    await fs.promises.writeFile(readmeFile, updatedContents);

    console.log("Updated README file");

    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function addStylesheet(tempPath: string) {
  console.debug("Adding Stylesheet...");
  const stylesheetDir = `${baseTemplateDir}/cssTheme`;

  try {
    await fse.copy(stylesheetDir, tempPath);
    console.log("Optional Stylesheet layer added");
    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function addSST(tempPath: string, appName: string) {
  console.debug("Adding SST...");
  const sstDir = `${baseTemplateDir}/sst`;
  const packageName = 'partyapp-' + appName.toLowerCase();

  try {
    await fse.copy(sstDir, tempPath);
    console.log("Optional SST layer added");

    console.debug("Updating svelte.config.js file");
    const svelteConfigPath = path.join(tempPath, "svelte.config.js");
    const svelteConfigContents = await fs.promises.readFile(svelteConfigPath, 'utf8');
    let updatedContents = svelteConfigContents.replace(
      "import adapter from '@sveltejs/adapter-auto';",
      "import adapter from 'svelte-kit-sst';"
    );
    await fs.promises.writeFile(svelteConfigPath, updatedContents);

    console.debug("Updating sst.config.ts file");
    const sstConfigPath = path.join(tempPath, "sst.config.ts");
    const sstConfigContents = await fs.promises.readFile(sstConfigPath, 'utf8');
    updatedContents = sstConfigContents.replace(/genstackapp/g, packageName);
    await fs.promises.writeFile(sstConfigPath, updatedContents);
    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function updatePackageJson(tempPath: string, request: AppRequest) {
  console.log("Building out package.json");
  const packageJsonFile = path.join(tempPath, 'package.json');

  try {
    const packageJsonContents = await fs.promises.readFile(packageJsonFile, 'utf8');
    let packageJson = JSON.parse(packageJsonContents);

    const packageName = 'partyapp-' + request.url.split('/')[6].toLowerCase();
    packageJson.name = packageName;

    if (request.optStylesheet) {
      console.debug("Adding Dependencies > Stylesheet");
      packageJson.dependencies['postcss'] = '^8.4.32';
      packageJson.dependencies['tailwindcss'] = '^3.4.0';
    }
    if (request.optSst) {
      console.debug("Adding Dependencies > SST for SvelteKit");
      packageJson.devDependencies['aws-cdk-lib'] = '^2.110.1';
      packageJson.devDependencies['constructs'] = '^10.3.0';
      packageJson.devDependencies['sst'] = '^2.39.4';
      packageJson.devDependencies['svelte-kit-sst'] = '^2.39.4';

      console.debug("Updating scripts to use SST");
      packageJson.scripts["dev"] = "sst bind vite dev";
      packageJson.scripts["sst:deploy"] = "sst deploy";
      packageJson.scripts["sst:dev"] = "sst dev";
    }

    await writeFile(packageJsonFile, JSON.stringify(packageJson, null, 4));
    console.log("Updated package.json file");

    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function createZipArchive(tempPath: string) {
  console.debug("Creating ZIP Archive...");

  const zipFileName = (tempPath.split('/').pop() || "app") + ".zip";
  const zipFilePath = path.join(os.tmpdir(), zipFileName);

  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  let archiveFinalized = new Promise<void>((resolve, reject) => {
    output.on('close', () => {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
      resolve();
    });

    archive.on('error', (err: any) => {
      reject(err);
    });
  });

  archive.pipe(output);
  archive.directory(tempPath, false);
  archive.finalize();

  await archiveFinalized;

  return zipFilePath;
}

async function readZipArchive(zipFilePath: string) {
  console.log("Reading back the ZIP archive contents...");
  try {
    const zipFileContents = await fs.promises.readFile(zipFilePath);
    const zipFileBase64 = zipFileContents.toString('base64');

    return zipFileBase64;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

function generateError(requestId: string, request: AppRequest, detail: string) {
  metrics.addMetric('BuildFailure', MetricUnits.Count, 1);
  metrics.publishStoredMetrics();

  logger.error("Build Failed", {
    requestId: requestId,
    failureDetails: detail,
    environment: dev ? "development" : "production",
    url: request.url,
    options: {
      stylesheet: request.optStylesheet,
      sst: request.optSst,
    }
  });

  return {
    status: false,
    body: {
      id: requestId,
      detail: detail,
    },
  };
}