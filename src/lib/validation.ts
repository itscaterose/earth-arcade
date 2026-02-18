import { NextApiResponse } from 'next'
import { ApiErrorResponse } from '@/types'

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Sanitizes user input by trimming and converting to lowercase for emails
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Validates and sanitizes a positive integer amount
 */
export function validatePositiveInteger(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    return null
  }
  return value
}

/**
 * Standard error response handler
 */
export function sendErrorResponse(
  res: NextApiResponse<ApiErrorResponse>,
  statusCode: number,
  error: string,
  details?: string
): void {
  res.status(statusCode).json({
    error,
    ...(details && { details })
  })
}

/**
 * Handles unknown errors and sends appropriate response
 */
export function handleUnknownError(
  res: NextApiResponse<ApiErrorResponse>,
  error: unknown,
  context: string
): void {
  console.error(`${context}:`, error)

  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

  sendErrorResponse(res, 500, errorMessage, context)
}

/**
 * Validates required environment variables
 */
export function validateEnvVars(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
