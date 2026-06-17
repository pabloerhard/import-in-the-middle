// The star re-export target is a bare specifier that cannot be resolved. While
// collecting exports, IITM yields a RESOLVE operation for it; the resolver
// throws, and that error has to be fed back into the loader generator (drive
// error handling in lib/io.mjs) before surfacing to the importer.
export * from 'iitm-test-nonexistent-star-target'
