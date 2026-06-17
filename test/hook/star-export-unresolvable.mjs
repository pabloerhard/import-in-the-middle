// Importing a module whose star re-export target cannot be resolved drives the
// asynchronous loader generator's error handling: the RESOLVE operation rejects
// and the rejection is thrown back into the generator (lib/io.mjs driveAsync)
// before surfacing to the importer.

import Hook from '../../index.js'
import { rejects } from 'assert'

const hook = new Hook((exports) => {})

await rejects(
  import('../fixtures/star-export-unresolvable.mjs'),
  /iitm-test-nonexistent-star-target/
)

hook.unhook()
