import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';

export interface RedirectionSiteProps {
    targetUrl: string;
    customDomain?: CustomDomainProps;
}

interface CustomDomainProps {
    domainName: string;
    hostedZone: string;
}

export class RedirectionSite extends Construct {
    public readonly cfDistributionUrl: string;
    public readonly url: string;

    constructor(scope: Construct, id: string, props: RedirectionSiteProps) {
        super(scope, id);

        const hostedZone = props.customDomain ? route53.HostedZone.fromLookup(this, "hostedZone", {
            domainName: props.customDomain?.hostedZone,
        }) : undefined;

        const distribution = new cloudfront.Distribution(this, "redirectDistribution", {
            defaultBehavior: {
                origin: new cloudfrontOrigins.S3Origin(new s3.Bucket(
                    this, "stubBucket", { removalPolicy: cdk.RemovalPolicy.DESTROY })),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
                functionAssociations: [{
                    function: new cloudfront.Function(this, "redirectFunction", {
                        code: cloudfront.FunctionCode.fromInline(`
                            function handler(event) {
                                var response = {
                                    statusCode: 302,
                                    statusDescription: "Found",
                                    headers: {
                                        'location': { value: "${props.targetUrl}" },
                                        'cloudfront-functions': { value: "redirect" }
                                    }
                                };
                                return response;
                            }
                        `)
                    }),
                    eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
                }]
            },
            domainNames: props.customDomain ? [props.customDomain?.domainName] : undefined,
            certificate: props.customDomain ? new acm.Certificate(this, "redirectCertificate", {
                domainName: props.customDomain.domainName,
                validation: acm.CertificateValidation.fromDns(hostedZone),
            }) : undefined,
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        });

        if (hostedZone) {
            const route53Record = new route53.RecordSet(this, "r53record", {
                zone: hostedZone,
                recordName: props.customDomain?.domainName,
                recordType: route53.RecordType.A,
                target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution)),
            });
        }

        this.cfDistributionUrl = `https://${distribution.domainName}`;
        this.url = props.customDomain ? `https://${props.customDomain.domainName}` : this.cfDistributionUrl;
    }
}