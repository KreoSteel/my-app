import { NextRequest } from "next/server";
import pool from "@/lib/supabase";
import { ApiResponses } from "@/app/api/lib/response";
import { getAuthenticatedUserId } from "@/app/api/lib/authUser";

// GET /api/friends - list my friends
export async function GET(req: NextRequest) {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
        return ApiResponses.unauthorized("You must be logged in to view friends");
    }

    try {
        const { rows } = await pool.query(
            `SELECT u.id, u.full_name, u.avatar_url
             FROM friends f
             JOIN users u ON u.id = f.friend_user_id
             WHERE f.user_id = $1
             ORDER BY u.full_name ASC`,
            [userId]
        );

        return ApiResponses.ok({ friends: rows });
    } catch (error) {
        console.error("List friends error:", error);
        return ApiResponses.internalServerError("Failed to list friends");
    }
}


