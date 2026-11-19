import * as crypto from "crypto"

const ALGO = "aes-256-gcm"
const IV_LEN = 12
const AUTH_TAG_LEN = 16
const PREFIX = "enc:"

function getKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw || raw.length < 16) return null
  return crypto.createHash("sha256").update(raw).digest()
}

/** True when ENCRYPTION_KEY is present and long enough to encrypt tokens. */
export function isEncryptionConfigured(): boolean {
  return getKey() != null
}

/**
 * Fail closed before writing third-party tokens.
 * Production always requires encryption. Development may allow plaintext only when
 * ALLOW_PLAINTEXT_TOKENS=1 is explicitly set (local prototyping).
 */
export function assertCanStoreTokens(): void {
  if (isEncryptionConfigured()) return
  const allowPlaintext =
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_PLAINTEXT_TOKENS === "1"
  if (allowPlaintext) return
  throw new Error(
    "ENCRYPTION_KEY is required to store integration tokens. Set ENCRYPTION_KEY (16+ chars)."
  )
}

/**
 * Encrypt a token for storage. Returns a string prefixed with "enc:".
 * Call assertCanStoreTokens() before persisting; this still refuses to return
 * plaintext unless ALLOW_PLAINTEXT_TOKENS=1 in non-production.
 */
export function encryptToken(plain: string): string {
  if (!plain) return plain
  const key = getKey()
  if (!key) {
    const allowPlaintext =
      process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_PLAINTEXT_TOKENS === "1"
    if (allowPlaintext) return plain
    throw new Error("ENCRYPTION_KEY is required to encrypt integration tokens")
  }
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  const combined = Buffer.concat([iv, tag, enc])
  return PREFIX + combined.toString("base64url")
}

/**
 * Decrypt a stored token. If the value does not start with "enc:", returns it unchanged (legacy plaintext).
 */
export function decryptToken(stored: string | null | undefined): string | null {
  if (stored == null || stored === "") return null
  if (!stored.startsWith(PREFIX)) return stored
  const key = getKey()
  if (!key) return null
  try {
    const buf = Buffer.from(stored.slice(PREFIX.length), "base64url")
    if (buf.length < IV_LEN + AUTH_TAG_LEN) return null
    const iv = buf.subarray(0, IV_LEN)
    const tag = buf.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN)
    const enc = buf.subarray(IV_LEN + AUTH_TAG_LEN)
    const decipher = crypto.createDecipheriv(ALGO, key, iv)
    decipher.setAuthTag(tag)
    return decipher.update(enc) + decipher.final("utf8")
  } catch {
    return null
  }
}

/**
 * Return integration tokens decrypted. Use this when reading an Integration from the DB before passing to APIs.
 */
export function getDecryptedIntegration<T extends { accessToken?: string | null; refreshToken?: string | null }>(
  row: T
): T & { accessToken: string | null; refreshToken: string | null } {
  return {
    ...row,
    accessToken: decryptToken(row.accessToken ?? undefined) ?? null,
    refreshToken: decryptToken(row.refreshToken ?? undefined) ?? null,
  }
}
