// PBKDF2 con WebCrypto: viene en Workers, sin dependencias. 100.000 es el
// máximo de iteraciones que acepta workerd.
const ITERACIONES = 100_000;
const codificador = new TextEncoder();

function aBase64(bytes: Uint8Array): string {
  let binario = "";
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario);
}

function deBase64(texto: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(texto), (c) => c.charCodeAt(0));
}

async function derivar(secreto: string, sal: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  const clave = await crypto.subtle.importKey("raw", codificador.encode(secreto), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: ITERACIONES },
    clave,
    256,
  );
  return new Uint8Array(bits);
}

/** Hash de un PIN o de la Clave de la casa, con sal propia: `sal:hash` en base64. */
export async function hashSecreto(secreto: string): Promise<string> {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  return `${aBase64(sal)}:${aBase64(await derivar(secreto, sal))}`;
}

export async function verificarSecreto(secreto: string, guardado: string): Promise<boolean> {
  const [sal, hash] = guardado.split(":");
  if (!sal || !hash) return false;
  const calculado = await derivar(secreto, deBase64(sal));
  const esperado = deBase64(hash);
  return igualesEnTiempoConstante(calculado, esperado);
}

// Comparación en tiempo constante, escrita a mano porque este archivo también lo
// revisa el programa de TypeScript del cliente, donde no existe crypto.subtle.timingSafeEqual.
function igualesEnTiempoConstante(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  let diferencia = 0;
  for (let i = 0; i < a.byteLength; i++) diferencia |= a[i]! ^ b[i]!;
  return diferencia === 0;
}

/** Token aleatorio para las cookies de dispositivo y de sesión. */
export function generarToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return aBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

/** En la base solo se guarda el SHA-256 del token. */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", codificador.encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
