import { register, supportsSyncHooks } from '../../register-hooks.mjs'
import Hook from '../../index.js'
import { strictEqual } from 'node:assert'

if (!supportsSyncHooks()) {
  console.log(`Skipping ${process.env.IITM_TEST_FILE || import.meta.url}: synchronous hooks unsupported on this Node.js`)
  process.exit(0)
}

register()

let sawSameSource = false
let sawNested = false

// eslint-disable-next-line no-new
new Hook((exports, name) => {
  if (typeof name === 'string' && name.includes('reexport-same-source.mjs')) {
    sawSameSource = true
    strictEqual(exports.val, 1)
  }
  if (typeof name === 'string' && name.includes('reexport-nested-top.mjs')) {
    sawNested = true
    strictEqual(exports.nested, 42)
  }
})

const lib = await import('../fixtures/reexport-same-source.mjs')
const nested = await import('../fixtures/reexport-nested-top.mjs')

strictEqual(sawSameSource, true)
strictEqual(lib.val, 1)
strictEqual(sawNested, true)
strictEqual(nested.nested, 42)
