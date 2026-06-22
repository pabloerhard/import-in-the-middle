// A consumer can pass `shouldInclude(url, specifier)` to take over the
// include/exclude decision. iitm then skips the include/exclude lists and the
// per-resolve file-path resolution the list matcher would otherwise need, so the
// predicate is called with exactly two arguments (no resolved file path).

import * as nodeModule from 'node:module'
import { register, supportsSyncHooks } from '../../register-hooks.mjs'
import Hook from '../../index.js'
import { ok, strictEqual } from 'node:assert'

if (!supportsSyncHooks()) {
  console.log(`Skipping ${process.env.IITM_TEST_FILE || import.meta.url}: synchronous hooks unsupported on this Node.js`)
  process.exit(0)
}

let thirdArg = 'unset'
register({
  shouldInclude (url, specifier, path) {
    thirdArg = path
    return /something\.mjs/.test(url)
  }
})

let somethingHooked = false
let bHooked = false

// eslint-disable-next-line no-new
new Hook((exports, name) => {
  if (typeof name === 'string' && /something\.mjs/.test(name)) somethingHooked = true
  if (typeof name === 'string' && /\bb\.mjs/.test(name)) bHooked = true
})

await import('../fixtures/something.mjs')
await import('../fixtures/b.mjs')

ok(somethingHooked, 'module the predicate accepts should be wrapped and hooked')
strictEqual(bHooked, false, 'module the predicate rejects should not be wrapped')
strictEqual(thirdArg, undefined, 'iitm must not compute or pass the file path to shouldInclude')

// sanity: the predicate path is only taken when registerHooks is available.
ok(typeof nodeModule.registerHooks === 'function')

console.log('✅ shouldInclude gates wrapping and is called with (url, specifier) only')
