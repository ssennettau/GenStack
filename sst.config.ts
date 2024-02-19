import type { SSTConfig } from "sst";
import { SvelteKitSite } from "sst/constructs";
import { Code, LayerVersion } from "aws-cdk-lib/aws-lambda";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { RedirectionSite } from "./cdk/redirectionsite";

export default {
  config(_input) {
    return {
      name: "genstack",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      const siteFqdn: string = "genstack.ssennett.net";

      const templateLayer = new LayerVersion(stack, "templateLayer", {
        code: Code.fromAsset("src/templateLayer"),
      });

      const site = new SvelteKitSite(stack, "site", {
        customDomain: stack.stage == "prod" ? {
          domainName: siteFqdn,
          hostedZone: "ssennett.net",
        } : undefined,
        cdk: {
          server: {
            logRetention: RetentionDays.INFINITE,
            layers: [templateLayer]
          }
        }
      });

      const redirectionSite = new RedirectionSite(stack, "redirectionSite", {
        targetUrl: `https://${siteFqdn}`,
        customDomain: stack.stage == "prod" ? {
          domainName: "partysmith.ssennett.net",
          hostedZone: "ssennett.net",
        } : undefined,
      });

      stack.addOutputs({
        siteUrl: site.url,
        distributionId: site.cdk?.distribution.distributionId,
        redirectUrl: redirectionSite.url,
      });
    });
  },
} satisfies SSTConfig;
