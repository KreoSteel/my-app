import jwt from 'json-web-token'

export interface JwtPayload {
  sub: string | number
  email: string
  fullName: string
  iat?: number
  exp?: number
  // you can add more custom claims as needed
}

export async function encode(payload: JwtPayload, expiresInSeconds?: number): Promise<string> {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')

  const nowSeconds = Math.floor(Date.now() / 1000)
  const basePayload: JwtPayload = { ...payload, iat: nowSeconds }
  const withExp: JwtPayload = typeof expiresInSeconds === 'number' && isFinite(expiresInSeconds)
    ? { ...basePayload, exp: nowSeconds + Math.floor(expiresInSeconds) }
    : basePayload

  return await new Promise((resolve, reject) => {
    ; (jwt as any).encode(secret, withExp, 'HS256', (err: any, token: string) => {
      if (err) return reject(err)
      resolve(token)
    })
  })
}

// Generate access token (short-lived, 15 minutes)
export async function generateAccessToken(payload: JwtPayload): Promise<string> {
  return encode(payload, 15 * 60) // 15 minutes
}

// Generate refresh token (long-lived, 7 days)
export async function generateRefreshToken(payload: JwtPayload): Promise<string> {
  return encode(payload, 7 * 24 * 60 * 60) // 7 days
}

export async function decode<T extends JwtPayload = JwtPayload>(token: string): Promise<T> {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')

  return await new Promise((resolve, reject) => {
    ; (jwt as any).decode(secret, token, (err: any, decodedPayload: T) => {
      if (err) return reject(err)
      resolve(decodedPayload)
    })
  })
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await decode(token)
    return true
  } catch (error) {
    return false
  }
}