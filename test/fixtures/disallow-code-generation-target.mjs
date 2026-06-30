// Combines the two source forms whose names/specifiers es-module-lexer decodes
// with an internal eval: a bare `export * from` (specifier decode) and a quoted
// export name (name decode). Under `--disallow-code-generation-from-strings`
// the Wasm build cannot decode either, so this fixture pins that IITM still
// wraps both via the asm.js fallback.
const value = 42

export * from 'some-external-module'
export { value as 'quoted name' }
