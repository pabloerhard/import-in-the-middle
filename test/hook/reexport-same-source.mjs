import * as lib from '../fixtures/reexport-same-source.mjs'
import * as nested from '../fixtures/reexport-nested-top.mjs'
import { strictEqual } from 'assert'
import Hook from '../../index.js'

// `val` reaches the entry module through two `export *` chains that both bottom
// out at the same leaf module, so per ECMAScript ResolveExport it is one binding
// that stays exported and keeps its value (issue #171). The previous dedup
// dropped it as ambiguous; reading the value off the aggregate namespace then
// returned undefined because Node sees the two chains as distinct wrapper
// modules. The wrapper reads each re-exported binding from its defining module.
//
// `nested` exercises the same collision one level down: the entry module
// `export *`s a module that itself resolved the collision, so the alias minted
// there has to propagate up into this wrapper's imports.
Hook((exports, name) => {
  if (name.includes('reexport-same-source.mjs')) {
    strictEqual('val' in exports, true)
    strictEqual(exports.val, 1)
  }
  if (name.includes('reexport-nested-top.mjs')) {
    strictEqual('nested' in exports, true)
    strictEqual(exports.nested, 42)
  }
})

strictEqual('val' in lib, true)
strictEqual(lib.val, 1)
strictEqual('nested' in nested, true)
strictEqual(nested.nested, 42)

const ambiguous = await import('../fixtures/duplicate.mjs')
const explicit = await import('../fixtures/duplicate-explicit.mjs')
const override = await import('../fixtures/reexport-explicit-override.mjs')

strictEqual('foo' in ambiguous, false)
strictEqual(explicit.foo, 'c')
strictEqual(override.foo, 'c')
