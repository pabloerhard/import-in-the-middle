// A `*` re-export of a module that itself resolved a same-origin collision, so
// the alias minted while processing reexport-nested-agg.mjs must propagate up
// to this wrapper's imports.
export * from './reexport-nested-agg.mjs'
