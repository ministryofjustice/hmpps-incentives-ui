#!/usr/bin/env npx ts-node
import path from 'path'

import { environments, getKubernetesSecret, portForward, namespaces } from './k8s'

type SecretData = {
  rds_instance_address: string
  database_name: string
  database_username: string
}

async function main(namespace: string, port: string) {
  process.stderr.write(`→ Will connect to RDS in ${namespace}\n`)

  process.stderr.write('→ Getting RDS secret\n')
  const rdsSecretName = 'dps-rds-instance-output'
  const secret = await getKubernetesSecret<SecretData>(namespace, rdsSecretName)

  const remotePort = '5432'
  const localPort = port ?? remotePort
  await portForward(namespace, secret.rds_instance_address, remotePort, localPort, 'connect-rds', () => {
    process.stderr.write(
      `Usage example:\n\`psql -h 127.0.0.1 -p ${port} -U ${secret.database_username} ${secret.database_name}\`\nGet RDS password with:\n\`kubectl --namespace ${namespace} get secret ${rdsSecretName} -o jsonpath={.data.database_password} | base64 -D\`\nClose port-forwarding connection with Ctrl-C.\n`,
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
  main(namespace, port).finally(() => process.stderr.write('→ Disconnected from RDS\n'))
}

cli()
