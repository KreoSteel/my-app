import { NextRequest } from "next/server";
import registerUser from "../../lib/auth";
import { generateAccessToken, generateRefreshToken } from "../../lib/jwt";
import { ApiResponses } from "../../lib/response";

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    try {
        const { fullName, email, password } = await req.json();

        if (!fullName || !email || !password) {
            return ApiResponses.badRequest("Missing required fields", "Full name, email, and password are required");
        }

        const result = await registerUser.registerUser(fullName, email, password);
        if ('error' in result) {
            return result.error === 'Email already in use' 
                ? ApiResponses.conflict(result.error, "An account with this email already exists")
                : ApiResponses.internalServerError(result.error);
        }

        const payload = { sub: result.id, email: result.email, fullName: result.fullName }
        const accessToken = await generateAccessToken(payload)
        const refreshToken = await generateRefreshToken(payload)
        
        console.log('Access Token:', accessToken)
        console.log('Refresh Token:', refreshToken)
        
        return ApiResponses.created({ 
            user: result, 
            accessToken, 
            refreshToken 
        }, "User registered successfully");

    } catch (error) {
        console.error("Registration error:", error);
        return ApiResponses.internalServerError("Internal server error", "An unexpected error occurred during registration");
    }
}