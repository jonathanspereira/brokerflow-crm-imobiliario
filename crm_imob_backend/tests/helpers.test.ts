import { formatPhone, sanitizePhone } from '../src/utils/helpers'

describe('helpers phone utils', () => {
  test('sanitizePhone removes non-digits', () => {
    expect(sanitizePhone('(11) 99999-9999')).toBe('11999999999')
  })

  test('formatPhone prefixes brazil country code when needed', () => {
    expect(formatPhone('11999999999')).toBe('5511999999999')
    expect(formatPhone('5511999999999')).toBe('5511999999999')
  })

  test('formatPhone returns original when pattern not matched', () => {
    expect(formatPhone('abc')).toBe('abc')
  })
})
