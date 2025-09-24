import { NextRequest, NextResponse } from "next/server";
import registerUser from "../../lib/auth";
import { generateAccessToken, generateRefreshToken } from "../../lib/jwt";

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    try {
        const { fullName, email, password } = await req.json();

        if (!fullName || !email || !password) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const result = await registerUser.registerUser(fullName, email, password);
        if ('error' in result) {
            const status = result.error === 'Email already in use' ? 409 : 500
            return NextResponse.json({ message: result.error }, { status });
        }

        const payload = { sub: result.id, email: result.email, fullName: result.fullName }
        const accessToken = await generateAccessToken(payload)
        const refreshToken = await generateRefreshToken(payload)
        
        console.log('Access Token:', accessToken)
        console.log('Refresh Token:', refreshToken)
        
        return NextResponse.json({ 
            user: result, 
            accessToken, 
            refreshToken 
        }, { status: 201 });

    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}