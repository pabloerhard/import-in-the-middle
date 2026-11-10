import {
  createWrapperModule,
  createWrapperModuleSync,
  type CreateWrapperModuleOptions,
  type CreateWrapperModuleSyncOptions,
  type WrapperImport,
  type WrapperModule,
  type WrapperResolveResult,
  type WrapperLoadResult
} from 'import-in-the-middle/wrapper.mjs'

const base = { url: 'file:///a.mjs', source: '', specifier: 'a' }
const rs = (): WrapperResolveResult => ({ url: 'file:///b.mjs' })
const ls = (): WrapperLoadResult => ({ source: '' })
const ra = async (): Promise<WrapperResolveResult> => ({ url: 'file:///b.mjs' })
const la = async (): Promise<WrapperLoadResult> => ({ source: '' })

const s: WrapperModule = createWrapperModuleSync({ ...base, resolve: rs, load: ls })
const p1: Promise<WrapperModule> = createWrapperModule({ ...base, resolve: ra, load: la })
const p2: Promise<WrapperModule> = createWrapperModule({ ...base, resolve: rs, load: ls })
const b1: WrapperModule = createWrapperModuleSync({ url: 'node:http', specifier: 'http' })
const b2: Promise<WrapperModule> = createWrapperModule({ url: 'node:http', specifier: 'http' })
const b3: Promise<WrapperModule> = createWrapperModule({ url: 'node:http', specifier: 'http', resolve: ra, load: la })
const syncOptions: CreateWrapperModuleSyncOptions = { ...base, resolve: rs, load: ls }
const asyncOptions: CreateWrapperModuleOptions = syncOptions

const code: string = s.code
const first: WrapperImport | undefined = s.imports[0]
const kind: 'runtime' | 'original' | 'module' | undefined = first?.kind
const url: string | undefined = first?.url
const format: string | undefined = first?.format
const placeholder: string | undefined = first?.specifier

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false
const exactKind: Equal<WrapperImport['kind'], 'runtime' | 'original' | 'module'> = true

// @ts-expect-error async resolve in createWrapperModuleSync
createWrapperModuleSync({ ...base, resolve: ra, load: ls })
// @ts-expect-error async load in createWrapperModuleSync
createWrapperModuleSync({ ...base, resolve: rs, load: la })
// @ts-expect-error createWrapperModuleSync does not return a Promise
const bad: Promise<WrapperModule> = createWrapperModuleSync({ ...base, resolve: rs, load: ls })
// @ts-expect-error createWrapperModule does not return a result object
const bad2: WrapperModule = createWrapperModule({ ...base, resolve: rs, load: ls })
// @ts-expect-error the result is not a string
const bad3: string = createWrapperModuleSync({ ...base, resolve: rs, load: ls })
// @ts-expect-error source is required
createWrapperModuleSync({ url: 'file:///a.mjs', specifier: 'a', resolve: rs, load: ls })
// @ts-expect-error source is required
createWrapperModule({ url: 'file:///a.mjs', specifier: 'a', resolve: ra, load: la })
// @ts-expect-error mapImport was replaced by the imports manifest
createWrapperModuleSync({ ...base, resolve: rs, load: ls, mapImport: (u: string) => u })

// @ts-expect-error only a node: URL may omit source and adapters
createWrapperModuleSync({ url: 'file:///a.mjs', specifier: 'a' })
// @ts-expect-error only a node: URL may omit source and adapters
createWrapperModule({ url: 'file:///a.mjs', specifier: 'a' })
// @ts-expect-error async adapters for a builtin in createWrapperModuleSync
createWrapperModuleSync({ url: 'node:http', specifier: 'http', resolve: ra })
// A `node:` url given with `source` and adapters still type-checks against the
// non-builtin branch (TypeScript cannot exclude a `node:` prefix from `string`);
// only the runtime rejects it, which test/wrapper/errors.mjs covers.

// @ts-expect-error watchFiles was removed
s.watchFiles.length
// @ts-expect-error sideEffects was removed
s.sideEffects.valueOf()
// @ts-expect-error imports entries are flat
first?.target

export {
  s, p1, p2, b1, b2, b3, syncOptions, asyncOptions, bad, bad2, bad3,
  code, kind, url, format, placeholder, exactKind
}
