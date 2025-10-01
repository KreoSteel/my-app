import { NextRequest } from 'next/server';
import pool from '@/lib/supabase';
import { ApiResponses } from '@/app/api/lib/response';
import { getAuthenticatedUserId } from '@/app/api/lib/authUser';
import { getUserBooks } from '@/app/api/lib/userBooks';

export async function GET(req: NextRequest, { params }: { params: { friendId: string } }) {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
        return ApiResponses.unauthorized('You must be logged in to view friend profiles');
    }


    const friendsCheck = await pool.query(
        `SELECT 1 FROM friends WHERE user_id = $1 AND friend_user_id = $2`,
        [userId, params.friendId]
    )

    if (friendsCheck.rowCount === 0) {
        return ApiResponses.forbidden("You can only view profiles of your friends")
    }

    const { rows } = await pool.query(
        `SELECT id, full_name, age, avatar_url, created_at as member_since
         FROM users WHERE id = $1`,
        [params.friendId]
    );

    if (rows.length === 0) {
        return ApiResponses.notFound('Friend not found');
    }

    const books = await getUserBooks(params.friendId);

    return ApiResponses.ok({
        profile: rows[0],
        books
    });
}