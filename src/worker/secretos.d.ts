// Secretos del Worker (no van en wrangler.jsonc). En local: `.dev.vars`; en producción: `wrangler secret put`.
interface SecretosDelWorker {
  /** Token que exige el asistente de configuración inicial. */
  TOKEN_INSTALACION?: string;
}
interface Env extends SecretosDelWorker {}
declare namespace Cloudflare {
  interface Env extends SecretosDelWorker {}
}
