import { NextRequest } from "next/server";
import loginUser from "../../lib/auth";
import { generateAccessToken, generateRefreshToken } from "../../lib/jwt";
import { ApiResponses } from "../../lib/response";

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return ApiResponses.badRequest("Missing required fields", "Email and password are required");
        }

        const result = await loginUser.loginUser(email, password);
        if ('error' in result) {
            return result.error === 'Invalid credentials' 
                ? ApiResponses.unauthorized(result.error, "Invalid email or password")
                : ApiResponses.internalServerError(result.error);
        }

        const payload = { sub: result.id, email: result.email, fullName: result.fullName }
        const accessToken = await generateAccessToken(payload)
        const refreshToken = await generateRefreshToken(payload)
        
        console.log('Access Token:', accessToken)
        console.log('Refresh Token:', refreshToken)
        
        return ApiResponses.ok({ 
            user: result, 
            accessToken, 
            refreshToken 
        }, "Login successful");

    } catch (error) {
        console.error("Login error:", error);
        return ApiResponses.internalServerError("Internal server error", "An unexpected error occurred during login");
    }
}