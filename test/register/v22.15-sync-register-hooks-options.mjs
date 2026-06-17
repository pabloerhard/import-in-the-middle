// Covers the option-carrying and double-registration branches of the
// synchronous `module.registerHooks` integration.

import { register, supportsSyncHooks } from '../../register-hooks.mjs'
import Hook from '../../index.js'
import { ok, strictEqual } from 'node:assert'

if (!supportsSyncHooks()) {
  console.log(`Skipping ${process.env.IITM_TEST_FILE || import.meta.url}: synchronous hooks unsupported on this Node.js`)
  process.exit(0)
}

// `include` restricts wrapping to matching modules: exercises the `if (options)`
// branch and the include filter on the synchronous resolve path.
register({ include: [/something\.mjs/] })

let warned = false
process.once('warning', (warning) => {
  if (/already been registered/.test(warning.message)) warned = true
})

// A second registration is a no-op that warns rather than installing twice.
register()

let somethingHooked = false
let bHooked = false

// eslint-disable-next-line no-new
new Hook((exports, name) => {
  if (typeof name === 'string' && /something\.mjs/.test(name)) somethingHooked = true
  if (typeof name === 'string' && /\bb\.mjs/.test(name)) bHooked = true
})

await import('../fixtures/something.mjs')
await import('../fixtures/b.mjs')

ok(somethingHooked, 'included module should be wrapped and hooked')
strictEqual(bHooked, false, 'module outside the include filter should not be wrapped')

// process.emitWarning fires on a later tick; let it run before asserting.
await new Promise((resolve) => setImmediate(resolve))
ok(warned, 'a second register() should emit an already-registered warning')
