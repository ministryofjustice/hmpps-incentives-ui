import 'dotenv/config'

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

export class AgentConfig {
  constructor(readonly timeout = 8000) {
    this.timeout = timeout
  }
}

export interface ApiConfig {
  url: string
  timeout: {
    response: number
    deadline: number
  }
  agent: AgentConfig
}

export default {
  environment: process.env.ENVIRONMENT || 'local',
  https: production,
  staticResourceCacheDuration: 20,
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
  sentry: {
    dsn: get('SENTRY_DSN', null, notRequiredInProduction),
  },
  s3: {
    region: get('S3_REGION', 'eu-west-1', notRequiredInProduction),
    bucket: get('S3_BUCKET_NAME', 'example-bucket', requiredInProduction),
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
      externalUrl: get('HMPPS_PRISON_API_EXTERNAL_URL', get('HMPPS_INCENTIVES_API_URL', 'http://localhost:2999')),
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
    nomisUserRolesApi: {
      url: get('NOMIS_USER_ROLES_API_URL', 'http://localhost:8081', requiredInProduction),
      externalUrl: get('NOMIS_USER_ROLES_API_EXTERNAL_URL', get('NOMIS_USER_ROLES_API_URL', 'http://localhost:8081')),
      timeout: {
        response: Number(get('NOMIS_USER_ROLES_API_TIMEOUT_RESPONSE', 8000)),
        deadline: Number(get('NOMIS_USER_ROLES_API_TIMEOUT_DEADLINE', 8000)),
      },
      agent: new AgentConfig(Number(get('NOMIS_USER_ROLES_API_TIMEOUT_RESPONSE', 8000))),
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
  },
  domain: get('INGRESS_URL', 'http://localhost:3000', requiredInProduction),
  dpsUrl: get('DPS_URL', 'http://localhost:3000', requiredInProduction),
  supportUrl: get('SUPPORT_URL', 'http://localhost:3000', requiredInProduction),
  googleAnalytics: {
    // Universal Analytics (UA) tracking ID - soon to be legacy. Starts with `UA-`.
    uaTrackingId: get('GOOGLE_ANALYTICS_UA_TRACKING_ID', ''),
    // Google Analytics 4 (GA4) measurement ID. Starts with `G-`.
    ga4MeasurementId: get('GOOGLE_ANALYTICS_GA4_MEASUREMENT_ID', ''),
  },
  featureFlags: {
    addTestErrorEndpoint: flag('FEATURE_ADD_TEST_ERROR_ENDPOINT', false),
    // Whether to hide the 'Days since last review'/'Days on level' columns
    hideDaysColumnsInIncentivesTable: flag('FEATURE_HIDE_DAYS_COLUMNS_IN_INCENTIVES_TABLE', false),
    showAnalyticsPcTrends: flag('FEATURE_SHOW_ANALYTICS_PC_TRENDS', false),
  },
  feedbackUrl: get('FEEDBACK_URL', ''),
  feedbackUrlForAnalytics: get('FEEDBACK_URL_ANALYTICS', ''),
  feedbackUrlForTable: get('FEEDBACK_URL_TABLE', ''),
  phaseName: get('PHASE_NAME', ''),
}
