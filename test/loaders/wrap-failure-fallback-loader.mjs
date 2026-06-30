// Upstream loader that returns unparsable source the first time a specific
// module is loaded. This simulates loaders/transforms that can temporarily
// return corrupted code, and is used to ensure IITM falls back gracefully when
// wrapping fails. The source must be un-tokenizable (here: an unterminated
// template literal) so es-module-lexer rejects it; the lexer tolerates some
// invalid-but-tokenizable source that a full parser would reject.

const WRAP_FAIL_URL = new URL('file:///virtual/wrap-failure.mjs').href

const loadCounts = new Map()

export async function resolve (specifier, context, parentResolve) {
  if (specifier === 'virtual-wrap-failure') {
    return { url: WRAP_FAIL_URL, format: 'module', shortCircuit: true }
  }
  // When IITM wraps the module, its generated wrapper will import the resolved
  // file URL directly. Avoid Node's default resolver trying to hit the
  // filesystem for these synthetic URLs.
  if (specifier === WRAP_FAIL_URL) {
    return { url: specifier, format: 'module', shortCircuit: true }
  }
  return parentResolve(specifier, context)
}

export async function load (url, context, parentLoad) {
  if (url === WRAP_FAIL_URL) {
    const next = (loadCounts.get(url) || 0) + 1
    loadCounts.set(url, next)
    if (next === 1) {
      // Un-tokenizable source (unterminated template literal) forces the lexer
      // to throw, so IITM wrapping fails and falls back.
      return { format: 'module', source: 'export const ok = `unterminated\n', shortCircuit: true }
    }
    // Valid JS on subsequent loads so the app can proceed.
    return { format: 'module', source: 'export const ok = 1\n', shortCircuit: true }
  }

  return parentLoad(url, context)
}
