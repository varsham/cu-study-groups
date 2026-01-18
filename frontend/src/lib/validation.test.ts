// ABOUTME: Tests for validation utility functions
// ABOUTME: Verifies Columbia email validation and error messages

import { describe, it, expect } from 'vitest'
import {
  validateColumbiaEmail,
  getEmailError,
  validateName,
  getNameError,
} from './validation'

describe('validateColumbiaEmail', () => {
  it('accepts valid columbia.edu email', () => {
    expect(validateColumbiaEmail('abc123@columbia.edu')).toBe(true)
  })

  it('accepts valid barnard.edu email', () => {
    expect(validateColumbiaEmail('student@barnard.edu')).toBe(true)
  })

  it('is case insensitive', () => {
    expect(validateColumbiaEmail('ABC123@COLUMBIA.EDU')).toBe(true)
    expect(validateColumbiaEmail('Student@Barnard.Edu')).toBe(true)
  })

  it('accepts emails with dots and plus signs', () => {
    expect(validateColumbiaEmail('john.doe@columbia.edu')).toBe(true)
    expect(validateColumbiaEmail('john+test@columbia.edu')).toBe(true)
  })

  it('trims whitespace', () => {
    expect(validateColumbiaEmail('  abc@columbia.edu  ')).toBe(true)
  })

  it('rejects non-Columbia emails', () => {
    expect(validateColumbiaEmail('test@gmail.com')).toBe(false)
    expect(validateColumbiaEmail('test@nyu.edu')).toBe(false)
    expect(validateColumbiaEmail('test@columbia.org')).toBe(false)
  })

  it('rejects emails with columbia.edu as subdomain', () => {
    expect(validateColumbiaEmail('test@mail.columbia.edu')).toBe(false)
  })

  it('rejects empty strings', () => {
    expect(validateColumbiaEmail('')).toBe(false)
    expect(validateColumbiaEmail('   ')).toBe(false)
  })

  it('rejects invalid email formats', () => {
    expect(validateColumbiaEmail('notanemail')).toBe(false)
    expect(validateColumbiaEmail('@columbia.edu')).toBe(false)
  })
})

describe('getEmailError', () => {
  it('returns null for valid columbia email', () => {
    expect(getEmailError('test@columbia.edu')).toBe(null)
  })

  it('returns null for valid barnard email', () => {
    expect(getEmailError('test@barnard.edu')).toBe(null)
  })

  it('returns required error for empty email', () => {
    expect(getEmailError('')).toBe('Email is required')
    expect(getEmailError('   ')).toBe('Email is required')
  })

  it('returns format error for missing @', () => {
    expect(getEmailError('notanemail')).toBe('Please enter a valid email address')
  })

  it('returns Columbia email error for non-Columbia emails', () => {
    expect(getEmailError('test@gmail.com')).toBe(
      'Please use your @columbia.edu or @barnard.edu email'
    )
  })
})

describe('validateName', () => {
  it('accepts valid names', () => {
    expect(validateName('John')).toBe(true)
    expect(validateName('John Doe')).toBe(true)
    expect(validateName('A')).toBe(true)
  })

  it('trims whitespace', () => {
    expect(validateName('  John  ')).toBe(true)
  })

  it('rejects empty names', () => {
    expect(validateName('')).toBe(false)
    expect(validateName('   ')).toBe(false)
  })

  it('rejects names over 100 characters', () => {
    const longName = 'a'.repeat(101)
    expect(validateName(longName)).toBe(false)
  })

  it('accepts names at exactly 100 characters', () => {
    const maxName = 'a'.repeat(100)
    expect(validateName(maxName)).toBe(true)
  })
})

describe('getNameError', () => {
  it('returns null for valid names', () => {
    expect(getNameError('John Doe')).toBe(null)
  })

  it('returns required error for empty names', () => {
    expect(getNameError('')).toBe('Name is required')
    expect(getNameError('   ')).toBe('Name is required')
  })

  it('returns length error for long names', () => {
    const longName = 'a'.repeat(101)
    expect(getNameError(longName)).toBe('Name must be 100 characters or less')
  })
})
