#!/usr/bin/env npx ts-node
import { randomBytes } from 'crypto'
import { once } from 'events'
import fs from 'fs'
import path from 'path'
import { ChildProcessByStdio, spawn } from 'child_process'
import { Readable } from 'stream'

const helmPath = path.resolve(__dirname, '../helm_deploy')

const environments = fs
  .readdirSync(helmPath)
  .map(filePath => /values-(?<env>.+).yaml/.exec(filePath))
  .filter(matches => Boolean(matches))
  .map(matches => matches.groups['env'])
const namespaces = Object.fromEntries(environments.map(environment => [environment, `hmpps-incentives-${environment}`]))

function printHelpAndExit() {
  const scriptName = path.basename(process.argv[1])
  process.stderr.write(`Usage: ./${scriptName} [${environments.join(' | ')}]\n`)
  process.exit(1)
}

function subprocessJsonPromise<T>(subprocess: ChildProcessByStdio<null, Readable, Readable>): Promise<T> {
  subprocess.stdout.setEncoding('utf8')
  return new Promise<T>((resolve, reject) => {
    let stdoutText = ''
    subprocess.stdout.on('data', data => {
      stdoutText += data
    })
    subprocess.on('close', exitCode => {
      if (exitCode) {
        reject(new Error(`Subprocess exited with ${exitCode}`))
      } else {
        const object = JSON.parse(stdoutText)
        resolve(object)
      }
    })
  })
}

function kubectl<T>(args: string[], captureJson?: true): ChildProcessByStdio<null, Readable, Readable>
function kubectl<T>(args: string[], captureJson: false): ChildProcessByStdio<null, null, Readable>
function kubectl<T>(args: string[], captureJson = true) {
  return spawn('kubectl', ['--namespace', namespace, ...(captureJson ? ['--output', 'json'] : []), ...args], {
    cwd: path.resolve(__dirname, '..'),
    shell: false,
    stdio: ['ignore', captureJson ? 'pipe' : 'inherit', 'inherit'],
  })
}

type Secret = {
  metadata: { name: string }
  data: SecretData
}

type SecretData = {
  rds_instance_address: string
  database_name: string
  database_username: string
  database_password: string
}

type Pod = {
  metadata: { name: string }
}

async function main(namespace: string) {
  process.stderr.write(`→ Will connect to RDS in ${namespace}\n`)

  process.stderr.write('→ Getting RDS secret\n')
  const subprocessSecrets = kubectl(['get', 'secrets'])
  const secrets: { items: Secret[] } = await subprocessJsonPromise(subprocessSecrets)

  const rdsSecretName = 'dps-rds-instance-output'
  const secret = secrets.items.find(secret => secret.metadata.name === rdsSecretName)
  if (!secret) {
    process.stderr.write('RDS secret not found')
    process.exit(1)
  }
  const rdsData = Object.fromEntries(
    Object.entries(secret.data).map(([key, value]) => {
      return [key, Buffer.from(value, 'base64').toString('utf8')]
    })
  ) as SecretData

  process.stderr.write('→ Starting port-forwarding pod\n')
  const podName = `connect-rds-${randomBytes(3).toString('hex')}`
  const subprocessRun = kubectl([
    'run',
    podName,
    '--image=ministryofjustice/port-forward',
    '--image-pull-policy=Always',
    '--restart=Never',
    '--port=5432',
    '--env',
    `REMOTE_HOST=${rdsData.rds_instance_address}`,
    '--env',
    'REMOTE_PORT=5432',
    '--env',
    'LOCAL_PORT=5432',
  ])
  const pod: Pod = await subprocessJsonPromise(subprocessRun)

  try {
    process.stderr.write(`→ Awaiting readiness of ${pod.metadata.name}\n`)
    const subprocessWait = kubectl(['wait', `pod/${podName}`, '--for', 'condition=Ready', '--timeout=60s'], false)
    await once(subprocessWait, 'close')

    const port = localPort ?? '5432'
    process.stderr.write(`→ Forwarding RDS connection to local port ${port}\n`)
    const subprocessPortForward = kubectl(['port-forward', `pod/${podName}`, `${port}:5432`], false)
    const kill = () => {
      process.off('SIGINT', kill)
      subprocessPortForward.kill('SIGINT')
    }
    process.on('SIGINT', kill)
    process.stderr.write(
      `Usage example:\n\`psql -h 127.0.0.1 -p ${port} -U ${rdsData.database_username} ${rdsData.database_name}\`\nGet RDS password with:\n\`kubectl --namespace ${namespace} get secrets ${rdsSecretName} -o jsonpath={.data.database_password} | base64 -D\`\nClose port-forwarding connection with Ctrl-C.\n`
    )
    await once(subprocessPortForward, 'close')
  } finally {
    process.stderr.write('→ Deleting port-forwarding pod\n')
    kubectl(['delete', 'pod', podName], false)
  }
}

const [environment, localPort] = process.argv.slice(2)
const namespace = namespaces[environment]
if (!namespace) {
  printHelpAndExit()
}
main(namespace).finally(() => process.stderr.write('→ Finished\n'))
