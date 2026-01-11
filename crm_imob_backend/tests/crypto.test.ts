import { encryptString, decryptString, hashDeterministic } from '../src/utils/crypto'

describe('crypto utils', () => {
  test('encrypt and decrypt returns original text', () => {
    const plaintext = 'cpf-valor-teste-123'
    const token = encryptString(plaintext)
    const recovered = decryptString(token)
    expect(recovered).toBe(plaintext)
  })

  test('deterministic hash is stable and unique', () => {
    const a = '12345678901'
    const b = '12345678902'
    const hashA1 = hashDeterministic(a)
    const hashA2 = hashDeterministic(a)
    const hashB = hashDeterministic(b)

    expect(hashA1).toBe(hashA2)
    expect(hashA1).not.toBe(hashB)
  })

  test('tampering ciphertext should throw on decrypt', () => {
    const plaintext = 'teste'
    const token = encryptString(plaintext)
    const parts = token.split('.')
    parts[1] = parts[1].replace(/.$/, parts[1].slice(-1) === 'A' ? 'B' : 'A')
    const tampered = parts.join('.')
    expect(() => decryptString(tampered)).toThrow()
  })
})
