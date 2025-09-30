import { NextRequest } from "next/server"
import { verifyToken } from "../../lib/jwt"
import { ApiResponses } from "../../lib/response"

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    const { token } = await req.json()

    if (!token) {
        return ApiResponses.unauthorized("Token is required", "Please provide a valid token");
    }
    
    try {
        await verifyToken(token)
        return ApiResponses.ok({ verified: true }, "Token verified successfully")
    } catch (error) {
        console.error("Verify token error:", error);
        return ApiResponses.unauthorized("Invalid token", "The provided token is invalid or expired");
    }
}