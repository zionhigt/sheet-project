import { build } from 'esbuild'
import path from 'path'

await build({
  entryPoints: [
    {in: 'public/js/sheet/sheet.js', out: 'sheet'},
    {in: 'public/js/parser/index.js', out: 'parser'},
  ],
  bundle: true,
  format: 'esm',
  outdir: 'dist',
  plugins: [
    {
      name: 'resolve-absolute-paths',
      setup(build) {
        // Intercepte tous les imports commençant par /lib
        build.onResolve({ filter: /^\/lib/ }, args => ({
          path: path.resolve('./src/lib', args.path.replace('/lib/', ''))
        }))
      }
    }
  ]
})