// Minimal ambient declaration for `import.meta.env.BASE_URL`, used when this
// package is consumed by a Vite app. Declared locally (instead of relying on
// `vite/client` types) so this package's own typecheck doesn't need a `vite`
// dependency.
interface ImportMetaEnv {
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
