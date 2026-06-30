'use strict'

import { initSync, parse as parseWasm } from 'es-module-lexer'

// The default es-module-lexer build is WebAssembly backed and decodes string
// literals (import specifiers, quoted export names) with an internal `eval`.
// Under `--disallow-code-generation-from-strings` that `eval` silently no-ops,
// so specifiers and quoted names come back undecoded (`* from undefined`,
// `"string name"` with the quotes still attached). The asm.js build
// (`es-module-lexer/js`) does the same work without `eval`, so fall back to it
// when code generation from strings is disallowed. Resolve the parser once at
// load time so the per-module path stays a bare `parse(source)` call.
//
// The flag is visible either as a direct `execArgv` entry or inside
// `NODE_OPTIONS`; a substring match is enough because no other flag contains it.
async function selectParse () {
  const flag = '--disallow-code-generation-from-strings'
  const disallowed = process.execArgv.includes(flag) ||
    (process.env.NODE_OPTIONS?.includes(flag) ?? false)

  if (disallowed) {
    // The asm.js build needs no compile step and parses synchronously, so it
    // works in `module.registerHooks` and the off-thread loader alike. V8 logs
    // a one-time "Invalid asm.js" notice and runs it as plain JS; that is the
    // expected, harmless cost of avoiding `eval` here. It is an ES module with
    // no CommonJS variant, so it has to come in through `import()` rather than
    // `require()`; the top-level await resolves before the loader is usable.
    return (await import('es-module-lexer/js')).parse
  }

  // initSync compiles the Wasm module up front so `parse` can run inside
  // synchronous loader hooks (`module.registerHooks`) as well as the off-thread
  // loader; it is a one-time cost on the first ESM module either way.
  initSync()
  return parseWasm
}

const parse = await selectParse()

/**
 * Decodes an exported identifier the way the JS engine would. es-module-lexer
 * leaves Unicode escapes in bare identifier exports (`export const \u0061 = 1`)
 * as their raw spelling, while the module namespace exposes the cooked name
 * (`a`). Quoted export names are already decoded by the lexer and start with a
 * quote in the source, so the cheap quote check keeps them on the fast path;
 * only a bare identifier carrying a backslash needs cooking. A malformed escape
 * falls back to the raw name rather than throwing inside the loader.
 *
 * @param {string} name The export name as reported by the lexer.
 * @returns {string} The cooked export name.
 */
function decodeExportName (name) {
  const first = name.charCodeAt(0)
  if (first === 0x22 /* " */ || first === 0x27 /* ' */ || !name.includes('\\')) {
    return name
  }
  try {
    return JSON.parse(`"${name}"`)
  } catch {
    return name
  }
}

// es-module-lexer reports a bare `export * from <mod>` only as an import with no
// matching export entry, indistinguishable from `import <mod>` except by the
// statement text. This matches that text to rewrite it as the transitive
// `* from <specifier>` marker the interpreting code recognizes. `export * as ns
// from` binds a real name and is reported as a normal export, so it must not
// match here. `GAP` allows whitespace and comments between the tokens, the way
// the parser does (e.g. `export /* c */ * from`).
const GAP = '(?:\\s|/\\*[^]*?\\*/|//[^\\n]*\\n)*'
const STAR_REEXPORT = new RegExp(`^export${GAP}\\*${GAP}from`)

/**
 * Lexes ESM source code with es-module-lexer and builds a list of exported
 * identifiers. In the baseline case the list is the simple identifier names as
 * written in the source. There is one special case:
 *
 * When an `export * from './foo.js'` line is encountered it is rewritten as
 * `* from ./foo.js`. This lets the interpreting code recognize a transitive
 * export and recursively parse the indicated module. The returned identifier
 * list will have "* from ./foo.js" as an item.
 *
 * @param {string} moduleSource The source code of the module to lex.
 * @returns {Set<string>} The identifiers exported by the module along with any
 * custom directives.
 */
export default function getEsmExports (moduleSource) {
  return lexEsm(moduleSource).exportNames
}

/**
 * Lexes ESM source code once and reports both the exported identifiers and
 * whether the source uses ESM syntax. Sharing a single `parse` lets the
 * unknown-format path in `getExports` decide between ESM and CommonJS without a
 * second pass over the source.
 *
 * `hasModuleSyntax` is es-module-lexer's own signal: static `import`/`export`
 * and `import.meta` set it, while a lone dynamic `import(...)` (valid in CJS)
 * does not.
 *
 * @param {string} moduleSource The source code of the module to lex.
 * @returns {{ exportNames: Set<string>, hasModuleSyntax: boolean }}
 */
export function lexEsm (moduleSource) {
  const exportNames = new Set()
  const [imports, exports, , hasModuleSyntax] = parse(moduleSource)

  for (const exported of exports) {
    exportNames.add(decodeExportName(exported.n))
  }

  // Bare `export * from <mod>` re-exports report no export name; reconstruct
  // the transitive marker from the import statement that carries the specifier.
  for (const imported of imports) {
    if (STAR_REEXPORT.test(moduleSource.slice(imported.ss, imported.se))) {
      exportNames.add(`* from ${imported.n}`)
    }
  }

  return { exportNames, hasModuleSyntax }
}
