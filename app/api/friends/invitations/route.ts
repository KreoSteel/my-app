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

    const insert = await pool.query(
        `INSERT INTO friend_invitations (inviter_id, inviter_email, token, expires_at)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [userId, email, token, expiresAt]
    );

    // Email-only flow: return only the id
    return ApiResponses.created({ id: insert.rows[0].id }, "Invitation created successfully");
}

export async function GET(req: NextRequest) {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
        return ApiResponses.unauthorized("You must be logged in to view invitations");
    }

    const userRes = await pool.query(
        `SELECT email FROM users WHERE id = $1`,
        [userId]
    );
    if (userRes.rowCount === 0) {
        return ApiResponses.notFound("User not found");
    }
    const myEmail: string = userRes.rows[0].email;


    const invites = await pool.query(
        `SELECT fi.id, fi.inviter_id, fi.inviter_email, fi.expires_at, fi.accepted_at,
                u.full_name as inviter_name
         FROM friend_invitations fi
         JOIN users u ON u.id = fi.inviter_id
         WHERE fi.inviter_email = $1
         ORDER BY fi.created_at DESC`,
        [myEmail]
    );

    const now = Date.now();
    const data = invites.rows.map((row) => ({
        id: row.id,
        inviter_id: row.inviter_id,
        inviter_name: row.inviter_name,
        inviter_email: row.inviter_email,
        expires_at: row.expires_at,
        accepted_at: row.accepted_at,
        expired: new Date(row.expires_at).getTime() < now,
    }));

    return ApiResponses.ok({ invites: data });
}
