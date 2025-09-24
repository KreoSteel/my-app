import { NextResponse, NextRequest } from "next/server"
import { verifyToken } from "../../lib/jwt"

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    const { token } = await req.json()

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    
    try {
        await verifyToken(token)
        return NextResponse.json({ message: "Token verified" }, { status: 200 })
    } catch (error) {
        console.error("Verify token error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}