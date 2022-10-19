#!/usr/bin/env npx ts-node
import path from 'path'

import { environments, getKubernetesSecret, portForward, namespaces } from './k8s'

type SecretData = {
  auth_token: string
  primary_endpoint_address: string
}

async function main(namespace: string, port: string | undefined) {
  process.stderr.write(`→ Will connect to Redis in ${namespace}\n`)

  process.stderr.write('→ Getting Redis secret\n')
  const redisSecretName = 'elasticache-redis'
  const secret = await getKubernetesSecret<SecretData>(namespace, redisSecretName)

  const remotePort = '6379'
  const localPort = port ?? remotePort
  await portForward(namespace, secret.primary_endpoint_address, remotePort, localPort, 'connect-redis', () => {
    process.stderr.write(
      `Usage example:\n\`redis-cli -h 127.0.0.1 -p ${localPort} --tls --insecure --askpass\`\nGet Redis auth token with:\n\`kubectl --namespace ${namespace} get secret ${redisSecretName} -o jsonpath={.data.auth_token} | base64 -D\`\nNB: Redis client must support TLS but must not check certificates as the domain will be incorrect.\nClose port-forwarding connection with Ctrl-C.\n`,
    )
  })
}

function cli() {
  const [environment, port] = process.argv.slice(2)
  const namespace = namespaces[environment]
  if (!namespace) {
    const scriptName = path.basename(process.argv[1])
    process.stderr.write(`Usage: ./${scriptName} [${environments.join(' | ')}] [local port]\n`)
    process.exit(1)
  }
  main(namespace, port).finally(() => process.stderr.write('→ Disconnected from Redis\n'))
}

cli()
