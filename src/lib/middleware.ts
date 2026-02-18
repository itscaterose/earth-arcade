import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type AuthenticatedRequest = NextApiRequest & {
  user?: {
    id: string
    email?: string
  }
}

/**
 * Middleware to verify the user is authenticated via Supabase auth
 * Extracts the JWT token from the Authorization header and verifies it
 */
export async function withAuth(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' })
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email
    }

    // Call the actual handler
    return handler(req, res)
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({ error: 'Authentication failed' })
  }
}

/**
 * Alternative: Verify API key for server-to-server communication
 * Use this for internal API calls that don't have a user context
 */
export async function withApiKey(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  const apiKey = req.headers['x-api-key']

  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' })
  }

  return handler(req, res)
}
