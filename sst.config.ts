import type { SSTConfig } from "sst";
import { SvelteKitSite } from "sst/constructs";
import { Code, LayerVersion } from "aws-cdk-lib/aws-lambda";

export default {
  config(_input) {
    return {
      name: "partysmith",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      const site = new SvelteKitSite(stack, "site", {
        customDomain: {
          domainName: "partysmith.ssennett.net",
          hostedZone: "ssennett.net",
        },
      });
      const templateLayer = new LayerVersion(stack, "templateLayer", {
        code: Code.fromAsset("src/templateLayer"),
      });

      stack.addOutputs({
        url: site.url,
        templateLayerArn: templateLayer.layerVersionArn,
      });
    });
  },
} satisfies SSTConfig;
