const esbuild = require('esbuild')
const { copy } = require('esbuild-plugin-copy')
const { typecheckPlugin } = require('@jgoz/esbuild-plugin-typecheck')
const glob = require('glob')

module.exports = buildConfig => {
  process.stderr.write('\u{1b}[36m→ Building app…\u{1b}[0m\n')

  esbuild
    .build({
      entryPoints: glob.sync(buildConfig.app.entryPoints),
      outdir: buildConfig.app.outDir,
      bundle: false,
      sourcemap: true,
      platform: 'node',
      target: 'node20',
      format: 'cjs',
      plugins: [
        typecheckPlugin(),
        copy({
          resolveFrom: 'cwd',
          assets: buildConfig.app.copy,
        }),
      ],
    })
    .catch(() => process.exit(1))
}
