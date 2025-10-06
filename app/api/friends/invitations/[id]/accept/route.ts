import { NextRequest } from "next/server";
import pool from "@/lib/supabase";
import { ApiResponses } from "@/app/api/lib/response";
import { getAuthenticatedUserId } from "@/app/api/lib/authUser";

// POST /api/friends/invitations/[id]/accept (email-only flow)
export async function POST(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    const params = await ctx.params;
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
        return ApiResponses.unauthorized("You must be logged in to accept invitations");
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Load invite and lock
        const inviteRes = await client.query(
            `SELECT fi.*, u.email as inviter_user_email
             FROM friend_invitations fi
             JOIN users u ON u.id = fi.inviter_id
             WHERE fi.id = $1
             FOR UPDATE`,
            [params.id]
        );
        if (inviteRes.rowCount === 0) {
            await client.query("ROLLBACK");
            return ApiResponses.notFound("Invitation not found");
        }
        const invite = inviteRes.rows[0];

        // Current user's email
        const meRes = await client.query(`SELECT email FROM users WHERE id = $1`, [userId]);
        if (meRes.rowCount === 0) {
            await client.query("ROLLBACK");
            return ApiResponses.notFound("User not found");
        }
        const myEmail: string = meRes.rows[0].email;

        // Check that this invite is addressed to me by email
        // Using inviter_email as recipient in existing schema
        if (invite.inviter_email !== myEmail) {
            await client.query("ROLLBACK");
            return ApiResponses.forbidden("This invitation is not addressed to you");
        }

        // Expiry check
        const isExpired = new Date(invite.expires_at).getTime() < Date.now();
        if (isExpired) {
            await client.query("ROLLBACK");
            return ApiResponses.forbidden("Invitation has expired");
        }

        if (invite.accepted_at) {
            // Ensure friendship exists, then return idempotent success
            const inviterId: string = invite.inviter_id;
            const accepterId: string = userId;
            await client.query(
                `INSERT INTO friends (user_id, friend_user_id)
                 SELECT $1, $2
                 WHERE NOT EXISTS (
                   SELECT 1 FROM friends WHERE user_id = $1 AND friend_user_id = $2
                 )`,
                [inviterId, accepterId]
            );
            await client.query(
                `INSERT INTO friends (user_id, friend_user_id)
                 SELECT $1, $2
                 WHERE NOT EXISTS (
                   SELECT 1 FROM friends WHERE user_id = $1 AND friend_user_id = $2
                 )`,
                [accepterId, inviterId]
            );
            await client.query("COMMIT");
            return ApiResponses.ok({ accepted: true, alreadyAccepted: true });
        }

        const inviterId: string = invite.inviter_id;
        const accepterId: string = userId;
        if (inviterId === accepterId) {
            await client.query("ROLLBACK");
            return ApiResponses.forbidden("Inviter cannot accept their own invitation");
        }

        await client.query(
            `INSERT INTO friends (user_id, friend_user_id)
             SELECT $1, $2
             WHERE NOT EXISTS (
               SELECT 1 FROM friends WHERE user_id = $1 AND friend_user_id = $2
             )`,
            [inviterId, accepterId]
        );
        await client.query(
            `INSERT INTO friends (user_id, friend_user_id)
             SELECT $1, $2
             WHERE NOT EXISTS (
               SELECT 1 FROM friends WHERE user_id = $1 AND friend_user_id = $2
             )`,
            [accepterId, inviterId]
        );

        await client.query(`UPDATE friend_invitations SET accepted_at = now() WHERE id = $1`, [invite.id]);

        await client.query("COMMIT");
        return ApiResponses.ok({ accepted: true });
    } catch (error) {
        try { await client.query("ROLLBACK"); } catch {}
        console.error("Accept invitation by id error:", error);
        return ApiResponses.internalServerError("Failed to accept invitation");
    } finally {
        client.release();
    }
}


