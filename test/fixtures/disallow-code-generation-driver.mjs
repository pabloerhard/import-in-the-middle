import { strictEqual } from 'assert'
import Hook from '../../index.js'

import { foo, 'quoted name' as quoted } from './disallow-code-generation-target.mjs'

Hook((exports, name) => {
  if (!name.endsWith('fixtures/disallow-code-generation-target.mjs')) return

  // `foo` arrives through `export * from 'some-external-module'`; reaching it
  // proves the star-re-export specifier was decoded. `quoted name` proves the
  // quoted export name was decoded.
  exports.foo = 'wrapped-foo'
  exports['quoted name'] = 'wrapped-quoted'
})

strictEqual(foo, 'wrapped-foo')
strictEqual(quoted, 'wrapped-quoted')
