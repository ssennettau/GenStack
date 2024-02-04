import type { SSTConfig } from "sst";
import { SvelteKitSite } from "sst/constructs";
import { Code, Function, LayerVersion } from "aws-cdk-lib/aws-lambda";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

export default {
  config(_input) {
    return {
      name: "partysmith",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      const templateLayer = new LayerVersion(stack, "templateLayer", {
        code: Code.fromAsset("src/templateLayer"),
      });

      const site = new SvelteKitSite(stack, "site", {
        customDomain: stack.stage == "prod" ? {
          domainName: "partysmith.ssennett.net",
          hostedZone: "ssennett.net",
        } : undefined,
        cdk: {
          server: {
            logRetention: RetentionDays.INFINITE,
            layers: [templateLayer]
          }
        }
      });

      stack.addOutputs({
        url: site.url,
        distributionId: site.cdk?.distribution.distributionId,
      });
    });
  },
} satisfies SSTConfig;
