import { ChildProcessByStdio, spawn } from 'child_process'
import { randomBytes } from 'crypto'
import { once } from 'events'
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'

const helmPath = path.resolve(__dirname, '../helm_deploy')
export const environments = fs
  .readdirSync(helmPath)
  .map(filePath => /values-(?<env>.+).yaml/.exec(filePath))
  .filter(matches => Boolean(matches))
  .map(matches => matches.groups.env)
export const namespaces = Object.fromEntries(
  environments.map(environment => [environment, `hmpps-incentives-${environment}`]),
)

export function readJsonFromSubprocess<T>(subprocess: ChildProcessByStdio<null, Readable, Readable>): Promise<T> {
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

export function kubectl(
  namespace: string,
  args: string[],
  captureJson?: true,
): ChildProcessByStdio<null, Readable, Readable>
export function kubectl(
  namespace: string,
  args: string[],
  captureJson: false,
): ChildProcessByStdio<null, null, Readable>
export function kubectl(namespace: string, args: string[], captureJson = true) {
  return spawn('kubectl', ['--namespace', namespace, ...(captureJson ? ['--output', 'json'] : []), ...args], {
    cwd: path.resolve(__dirname, '..'),
    shell: false,
    stdio: ['ignore', captureJson ? 'pipe' : 'inherit', 'inherit'],
  })
}

export async function getKubernetesSecret<T extends Record<string, string>>(
  namespace: string,
  name: string,
): Promise<T> {
  type Secret = {
    metadata: { name: string }
    data: Record<string, string>
  }
  const subprocess = kubectl(namespace, ['get', 'secret', name])
  const secret = await readJsonFromSubprocess<Secret>(subprocess)
  return Object.fromEntries(
    Object.entries(secret.data).map(([key, value]) => {
      return [key, Buffer.from(value, 'base64').toString('utf8')]
    }),
  ) as T
}

export async function portForward(
  namespace: string,
  remoteHost: string,
  remotePort: string,
  localPort: string,
  podNamePrefix: string,
  callback: () => void,
): Promise<void> {
  const podName = `${podNamePrefix}-${randomBytes(3).toString('hex')}`

  process.stderr.write('→ Starting port-forwarding pod\n')
  const subprocessRun = kubectl(namespace, [
    'run',
    podName,
    '--image=ministryofjustice/port-forward',
    '--image-pull-policy=Always',
    '--restart=Never',
    `--port=${remotePort}`,
    '--env',
    `REMOTE_HOST=${remoteHost}`,
    '--env',
    `REMOTE_PORT=${remotePort}`,
    '--env',
    `LOCAL_PORT=${remotePort}`,
  ])
  await readJsonFromSubprocess(subprocessRun)

  try {
    process.stderr.write(`→ Awaiting readiness of ${podName}\n`)
    const subprocessWait = kubectl(
      namespace,
      ['wait', `pod/${podName}`, '--for', 'condition=Ready', '--timeout=60s'],
      false,
    )
    await once(subprocessWait, 'close')

    process.stderr.write(`→ Forwarding connection to local port ${localPort}\n`)
    const subprocessPortForward = kubectl(
      namespace,
      ['port-forward', `pod/${podName}`, `${localPort}:${remotePort}`],
      false,
    )
    const kill = () => {
      process.off('SIGINT', kill)
      subprocessPortForward.kill('SIGINT')
    }
    process.on('SIGINT', kill)
    callback()
    await once(subprocessPortForward, 'close')
  } finally {
    process.stderr.write('→ Deleting port-forwarding pod\n')
    const subprocessDelete = kubectl(namespace, ['delete', 'pod', podName], false)
    await once(subprocessDelete, 'close')
  }
}
