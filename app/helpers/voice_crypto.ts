/**
 * Criptografia AES-256-GCM para chaves de API por empresa (BYOK).
 * Usa APP_KEY do AdonisJS como chave derivada.
 */
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

function deriveKey(appKey: string): Buffer {
  return createHash('sha256').update(appKey).digest()
}

/**
 * Criptografa um texto plano com AES-256-GCM.
 * Retorna string no formato: iv:tag:ciphertext (hex-encoded)
 */
export function encrypt(plainText: string, appKey: string): string {
  const key = deriveKey(appKey)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plainText, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

/**
 * Descriptografa um texto criptografado com AES-256-GCM.
 * Espera string no formato: iv:tag:ciphertext (hex-encoded)
 */
export function decrypt(encryptedText: string, appKey: string): string {
  const key = deriveKey(appKey)
  const parts = encryptedText.split(':')
  if (parts.length !== 3) {
    throw new Error('Formato de texto criptografado inválido')
  }

  const iv = Buffer.from(parts[0], 'hex')
  const tag = Buffer.from(parts[1], 'hex')
  const ciphertext = parts[2]

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
