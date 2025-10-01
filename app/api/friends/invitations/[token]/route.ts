import { NextRequest } from "next/server";
import pool from "@/lib/supabase";
import { ApiResponses } from "@/app/api/lib/response";
import { getAuthenticatedUserId } from "@/app/api/lib/authUser";

export async function GET(
    req: NextRequest,
    { params }: { params: { token: string } }
) {
    const { rows } = await pool.query(
        `SELECT fi.*, u.full_name as inviter_name 
        FROM friend_invitations fi
        JOIN users u ON u.id = fi.inviter_id 
        WHERE token = $1`,
        [params.token]
    );

    if (rows.length === 0) {
        return ApiResponses.notFound("Invitation not found");
    }

    const invite = rows[0];

    const expired = new Date(invite.expires_at).getTime() < Date.now();

    return ApiResponses.ok({
        invite: {
            inviter_name: invite.inviter_name,
            inviter_email: invite.inviter_email,
            expires_at: invite.expires_at,
            accepted_at: invite.accepted_at,
        },
        expired,
    });
}
