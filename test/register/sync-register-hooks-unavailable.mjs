// Not version-gated on purpose: this asserts the error path that only the Node
// versions without module.registerHooks (< 22.15 / 23.0-23.4) can reach. On
// newer Node the success path is covered by the sync-register-hooks tests.

import * as nodeModule from 'node:module'
import { register } from '../../register-hooks.mjs'
import { throws } from 'node:assert'

if (typeof nodeModule.registerHooks === 'function') {
  console.log(`Skipping ${process.env.IITM_TEST_FILE || import.meta.url}: module.registerHooks is available`)
  process.exit(0)
}

throws(() => register(), { message: /module\.registerHooks/ })
