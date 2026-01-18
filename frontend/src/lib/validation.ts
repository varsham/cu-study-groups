// ABOUTME: Validation utilities for CU Study Groups
// ABOUTME: Validates Columbia University email addresses

const COLUMBIA_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@columbia\.edu$/i
const BARNARD_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@barnard\.edu$/i

/**
 * Validates that an email is a Columbia or Barnard email address.
 * @param email - Email address to validate
 * @returns True if the email is a valid Columbia/Barnard email
 */
export function validateColumbiaEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase()
  return COLUMBIA_EMAIL_REGEX.test(trimmed) || BARNARD_EMAIL_REGEX.test(trimmed)
}

/**
 * Gets a human-readable error message for email validation.
 * @param email - Email address to validate
 * @returns Error message or null if valid
 */
export function getEmailError(email: string): string | null {
  const trimmed = email.trim()

  if (!trimmed) {
    return 'Email is required'
  }

  if (!trimmed.includes('@')) {
    return 'Please enter a valid email address'
  }

  if (!validateColumbiaEmail(trimmed)) {
    return 'Please use your @columbia.edu or @barnard.edu email'
  }

  return null
}

/**
 * Validates a participant name.
 * @param name - Name to validate
 * @returns True if the name is valid
 */
export function validateName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length >= 1 && trimmed.length <= 100
}

/**
 * Gets a human-readable error message for name validation.
 * @param name - Name to validate
 * @returns Error message or null if valid
 */
export function getNameError(name: string): string | null {
  const trimmed = name.trim()

  if (!trimmed) {
    return 'Name is required'
  }

  if (trimmed.length > 100) {
    return 'Name must be 100 characters or less'
  }

  return null
}
