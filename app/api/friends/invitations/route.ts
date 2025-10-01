import { NextRequest } from "next/server";
import pool from "@/lib/supabase";
import { ApiResponses } from "@/app/api/lib/response";
import { getAuthenticatedUserId } from "@/app/api/lib/authUser";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
        return ApiResponses.unauthorized("You must be logged in to send invitations");
    }

    const { email } = await req.json();
    if (!email) {
        return ApiResponses.badRequest("Email is required");
    }

    const token = crypto.randomBytes(24).toString("base64url")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await pool.query(
        `INSERT INTO friend_invitations (inviter_id, inviter_email, token, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [userId, email, token, expiresAt]
    );

    const link = `/friends/invite/${token}`

    return ApiResponses.created({ token, link }, "Invitation created successfully");
}
