import { CloudTrailClient, DescribeTrailsCommand } from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
} from '@aws-sdk/client-config-service';
import { IAMClient, ListRolesCommand } from '@aws-sdk/client-iam';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

export type AwsSummary = {
  connected: boolean;
  error: string | null;
  identity: {
    accountId: string | null;
    arn: string | null;
    principal: string | null;
    region: string | null;
  };
  resources: {
    total: number;
    cloudTrails: number;
    configRecorders: number;
    s3Buckets: number;
    logGroups: number;
    iamRoles: number;
  };
  discovered: {
    cloudTrails: string[];
    configRecorders: string[];
    s3Buckets: string[];
    logGroups: string[];
    iamRoles: string[];
  };
};

const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1';

function createClients() {
  const config = { region };

  return {
    sts: new STSClient(config),
    cloudTrail: new CloudTrailClient(config),
    configService: new ConfigServiceClient(config),
    s3: new S3Client(config),
    logs: new CloudWatchLogsClient(config),
    iam: new IAMClient(config),
  };
}

function principalFromArn(arn: string | undefined | null) {
  if (!arn) {
    return null;
  }

  const parts = arn.split('/');
  return parts[parts.length - 1] ?? arn;
}

function asNames<T extends { Name?: string; TrailARN?: string }>(items: T[] | undefined) {
  return (items ?? [])
    .map((item) => item.Name ?? item.TrailARN ?? '')
    .filter(Boolean);
}

export async function getAwsSummary(): Promise<AwsSummary> {
  const clients = createClients();

  try {
    const identity = await clients.sts.send(new GetCallerIdentityCommand({}));

    const [cloudTrails, configRecorders, buckets, logGroups, iamRoles] = await Promise.all([
      clients.cloudTrail.send(new DescribeTrailsCommand({ includeShadowTrails: false })),
      clients.configService.send(new DescribeConfigurationRecordersCommand({})),
      clients.s3.send(new ListBucketsCommand({})),
      clients.logs.send(new DescribeLogGroupsCommand({ limit: 50 })),
      clients.iam.send(new ListRolesCommand({ MaxItems: 50 })),
    ]);

    const trailNames = asNames(cloudTrails.trailList);
    const recorderNames = (configRecorders.ConfigurationRecorders ?? []).map(
      (recording) => recording.name ?? 'configuration-recorder',
    );
    const bucketNames = (buckets.Buckets ?? [])
      .map((bucket) => bucket.Name ?? '')
      .filter(Boolean);
    const logGroupNames = (logGroups.logGroups ?? [])
      .map((group) => group.logGroupName ?? '')
      .filter(Boolean);
    const roleNames = (iamRoles.Roles ?? [])
      .map((role) => role.RoleName ?? '')
      .filter(Boolean);

    const total =
      trailNames.length + recorderNames.length + bucketNames.length + logGroupNames.length + roleNames.length;

    return {
      connected: true,
      error: null,
      identity: {
        accountId: identity.Account ?? null,
        arn: identity.Arn ?? null,
        principal: principalFromArn(identity.Arn),
        region,
      },
      resources: {
        total,
        cloudTrails: trailNames.length,
        configRecorders: recorderNames.length,
        s3Buckets: bucketNames.length,
        logGroups: logGroupNames.length,
        iamRoles: roleNames.length,
      },
      discovered: {
        cloudTrails: trailNames,
        configRecorders: recorderNames,
        s3Buckets: bucketNames,
        logGroups: logGroupNames,
        iamRoles: roleNames,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to connect to AWS';

    return {
      connected: false,
      error: message,
      identity: {
        accountId: null,
        arn: null,
        principal: null,
        region,
      },
      resources: {
        total: 0,
        cloudTrails: 0,
        configRecorders: 0,
        s3Buckets: 0,
        logGroups: 0,
        iamRoles: 0,
      },
      discovered: {
        cloudTrails: [],
        configRecorders: [],
        s3Buckets: [],
        logGroups: [],
        iamRoles: [],
      },
    };
  }
}