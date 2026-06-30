// Regression test for the es-module-lexer swap: under
// `--disallow-code-generation-from-strings` the default Wasm build's internal
// eval no-ops, so it stops decoding import specifiers and quoted export names.
// IITM then rebuilds `export * from` as `* from undefined` and keeps quoted
// names quoted, wrapping the wrong (or no) exports. get-esm-exports falls back
// to the eval-free asm.js build under the flag; this drives the real Hook to
// prove both decode paths still resolve. The flag goes in the child's execArgv
// so the loader thread inherits it.
import { strictEqual } from 'assert'
import { spawn } from 'child_process'

const node = process.execPath

const child = spawn(node, [
  '--disallow-code-generation-from-strings',
  '--no-warnings',
  '--experimental-loader',
  './test/generic-loader.mjs',
  './test/fixtures/disallow-code-generation-driver.mjs'
], {
  stdio: 'inherit',
  env: { ...process.env, NODE_OPTIONS: '' }
})

const code = await new Promise((resolve) => child.on('close', resolve))
strictEqual(code, 0)
