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

/**
 * Encrypt a token for storage. Returns a string prefixed with "enc:" so we can detect encrypted values.
 * If ENCRYPTION_KEY is not set, returns plaintext (backward compatible).
 */
export function encryptToken(plain: string): string {
  if (!plain) return plain
  const key = getKey()
  if (!key) return plain
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
  if (!key) return stored
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
