import { AgentConfig } from '@ministryofjustice/hmpps-rest-client'

const production = process.env.NODE_ENV === 'production'

type EnvOptions = { requireInProduction: boolean }
const requiredInProduction: EnvOptions = { requireInProduction: true }
const notRequiredInProduction: EnvOptions = { requireInProduction: false }

function get<T>(name: string, fallback: T, options: EnvOptions = notRequiredInProduction): T | string {
  if (process.env[name]) {
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

function flag(name: string, fallback = false, options: EnvOptions = notRequiredInProduction): boolean {
  const value = get(name, fallback.toString(), options).toLowerCase()
  return value === 'true' || value === '1'
}

export interface ApplicationInfo {
  applicationName: string
  productId: string
  buildNumber: string
  gitRef: string
}

const applicationInfo: ApplicationInfo = {
  applicationName: 'hmpps-incentives-ui',
  productId: get('PRODUCT_ID', 'DPS???', requiredInProduction),
  buildNumber: get('BUILD_NUMBER', '2022-01-07.1.ef03202', requiredInProduction),
  gitRef: get('GIT_REF', 'unknown', requiredInProduction),
}

const auditConfig = () => {
  const auditEnabled = get('AUDIT_ENABLED', 'false') === 'true'
  return {
    enabled: auditEnabled,
    queueUrl: get(
      'AUDIT_SQS_QUEUE_URL',
      'http://localhost:4566/000000000000/mainQueue',
      auditEnabled && requiredInProduction,
    ),
    serviceName: get('AUDIT_SERVICE_NAME', 'UNASSIGNED', auditEnabled && requiredInProduction),
    region: get('AUDIT_SQS_REGION', 'eu-west-2'),
  }
}

export default {
  applicationInfo,
  production, // NB: this is true in _all_ deployed environments
  environment: process.env.ENVIRONMENT || 'local',
  https: production,
  staticResourceCacheDuration: '1h',
  redis: {
    host: get('REDIS_HOST', 'localhost', requiredInProduction),
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_AUTH_TOKEN,
    tls_enabled: flag('REDIS_TLS_ENABLED', false),
  },
  session: {
    secret: get('SESSION_SECRET', 'app-insecure-default-session', requiredInProduction),
    expiryMinutes: Number(get('WEB_SESSION_TIMEOUT_IN_MINUTES', 120)),
  },
  s3: {
    region: get('S3_REGION', 'eu-west-1', notRequiredInProduction),
    bucket: get('S3_BUCKET_NAME', 'example-bucket', requiredInProduction),
    /**
     * NB: the IAM access key is _not_ available to apps running in Cloud Platform,
     * IRSA is used instead for read-only access to the bucket.
     * For running locally and for integration testing, minio is used with an IAM access key.
     */
    accessKeyId: get('S3_ACCESS_KEY_ID', null, notRequiredInProduction),
    secretAccessKey: get('S3_SECRET_ACCESS_KEY', null, notRequiredInProduction),
    endpoint: get('S3_ENDPOINT', null, notRequiredInProduction),
  },
  apis: {
    hmppsAuth: {
      url: get('HMPPS_AUTH_URL', 'http://localhost:9090/auth', requiredInProduction),
      externalUrl: get('HMPPS_AUTH_EXTERNAL_URL', get('HMPPS_AUTH_URL', 'http://localhost:9090/auth')),
      timeout: {
        response: Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('HMPPS_AUTH_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000))),
      apiClientId: get('API_CLIENT_ID', 'clientid', requiredInProduction),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret', requiredInProduction),
      systemClientId: get('SYSTEM_CLIENT_ID', 'clientid', requiredInProduction),
      systemClientSecret: get('SYSTEM_CLIENT_SECRET', 'clientsecret', requiredInProduction),
    },
    hmppsIncentivesApi: {
      url: get('HMPPS_INCENTIVES_API_URL', 'http://localhost:2999', requiredInProduction),
      externalUrl: get('HMPPS_INCENTIVES_API_EXTERNAL_URL', get('HMPPS_INCENTIVES_API_URL', 'http://localhost:2999')),
      timeout: {
        response: Number(get('HMPPS_INCENTIVES_API_TIMEOUT_RESPONSE', 60000)),
        deadline: Number(get('HMPPS_INCENTIVES_API_TIMEOUT_DEADLINE', 60000)),
      },
      agent: new AgentConfig(Number(get('HMPPS_INCENTIVES_API_TIMEOUT_RESPONSE', 60000))),
    },
    hmppsPrisonApi: {
      url: get('HMPPS_PRISON_API_URL', 'http://localhost:8080', requiredInProduction),
      externalUrl: get('HMPPS_PRISON_API_EXTERNAL_URL', get('HMPPS_PRISON_API_URL', 'http://localhost:8080')),
      timeout: {
        response: Number(get('HMPPS_PRISON_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('HMPPS_PRISON_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('HMPPS_PRISON_API_TIMEOUT_RESPONSE', 10000))),
    },
    offenderSearchApi: {
      url: get('OFFENDER_SEARCH_API_URL', 'http://localhost:8083', requiredInProduction),
      externalUrl: get('OFFENDER_SEARCH_API_EXTERNAL_URL', get('OFFENDER_SEARCH_API_URL', 'http://localhost:8083')),
      timeout: {
        response: Number(get('OFFENDER_SEARCH_API_TIMEOUT_RESPONSE', 8000)),
        deadline: Number(get('OFFENDER_SEARCH_API_TIMEOUT_DEADLINE', 8000)),
      },
      agent: new AgentConfig(Number(get('OFFENDER_SEARCH_API_TIMEOUT_RESPONSE', 8000))),
    },
    nomisUserRolesApi: {
      url: get('NOMIS_USER_ROLES_API_URL', 'http://localhost:8081', requiredInProduction),
      externalUrl: get('NOMIS_USER_ROLES_API_EXTERNAL_URL', get('NOMIS_USER_ROLES_API_URL', 'http://localhost:8081')),
      timeout: {
        response: Number(get('NOMIS_USER_ROLES_API_TIMEOUT_RESPONSE', 8000)),
        deadline: Number(get('NOMIS_USER_ROLES_API_TIMEOUT_DEADLINE', 8000)),
      },
      agent: new AgentConfig(Number(get('NOMIS_USER_ROLES_API_TIMEOUT_RESPONSE', 8000))),
    },
    manageUsersApi: {
      url: get('MANAGE_USERS_API_URL', 'http://localhost:9091', requiredInProduction),
      timeout: {
        response: Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('MANAGE_USERS_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 10000))),
    },
    tokenVerification: {
      url: get('TOKEN_VERIFICATION_API_URL', 'http://localhost:8100', requiredInProduction),
      timeout: {
        response: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_DEADLINE', 5000)),
      },
      agent: new AgentConfig(Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000))),
      enabled: flag('TOKEN_VERIFICATION_ENABLED', false),
    },
    zendesk: {
      url: get('ZENDESK_URL', 'https://ministryofjustice.zendesk.com', notRequiredInProduction),
      timeout: {
        response: Number(get('ZENDESK_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('ZENDESK_TIMEOUT_DEADLINE', 5000)),
      },
      agent: new AgentConfig(Number(get('ZENDESK_TIMEOUT_RESPONSE', 5000))),
      username: get('ZENDESK_USERNAME', '', requiredInProduction),
      token: get('ZENDESK_TOKEN', '', requiredInProduction),
    },
    frontendComponents: {
      url: get('COMPONENT_API_URL', 'http://localhost:8082', requiredInProduction),
      timeout: {
        response: Number(get('COMPONENT_API_TIMEOUT_SECONDS', 5000)),
        deadline: Number(get('COMPONENT_API_TIMEOUT_SECONDS', 5000)),
      },
      agent: new AgentConfig(Number(get('COMPONENT_API_TIMEOUT_SECONDS', 5000))),
    },
  },
  sqs: {
    audit: auditConfig(),
  },
  ingressUrl: get('INGRESS_URL', 'http://localhost:3000', requiredInProduction),
  dpsUrl: get('DPS_URL', 'http://localhost:3000', requiredInProduction),
  supportUrl: get('SUPPORT_URL', 'http://localhost:3000', requiredInProduction),
  googleAnalytics: {
    // Google Analytics 4 (GA4) measurement ID. Starts with `G-`.
    ga4MeasurementId: get('GOOGLE_ANALYTICS_GA4_MEASUREMENT_ID', ''),
  },
  featureFlags: {
    addTestErrorEndpoint: flag('FEATURE_ADD_TEST_ERROR_ENDPOINT', false),
    useFileSystemCache: flag('FEATURE_FS_CACHE', false),
    precacheTables: flag('FEATURE_PRECACHE_TABLES', false),
  },
  analyticsDataStaleAferDays: Number(get('ANALYTICS_DATA_STALE_AFTER_DAYS', 0)),
  phaseName: get('PHASE_NAME', ''),
}
