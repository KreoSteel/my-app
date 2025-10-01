import { NextRequest } from "next/server";
import { decode } from "@/app/api/lib/jwt";

export async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
    const auth = req.headers.get('authorization')

    if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
        return null
    }

    const token = auth.slice(7)

    try {
        const payload = await decode(token)
        if (typeof payload?.sub === "string") {
            return payload.sub
        }
        return null
    } catch {
        return null
    }
} 