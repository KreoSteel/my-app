import { NextRequest } from 'next/server';
import { ApiResponses } from '@/app/api/lib/response';
import { updateUserBook, removeBookFromUserList, getUserBookById } from '@/app/api/lib/userBooks';
import { decode } from '@/app/api/lib/jwt';
import type { UserBook } from '@/app/types/UserBook';

export const runtime = 'nodejs';

// PUT /api/user-books/[id] - Update user book
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Await params before accessing properties
        const { id } = await params;
        
        // Extract token from Authorization header
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return ApiResponses.unauthorized('Missing or invalid authorization header');
        }

        const token = authHeader.substring(7);
        
        // Decode and verify token
        const payload = await decode(token);
        const userId = payload.sub.toString();

        // Check if user book exists and belongs to user
        const existingUserBook = await getUserBookById(id);
        if (!existingUserBook) {
            return ApiResponses.notFound('User book not found');
        }

        if (existingUserBook.user_id !== userId) {
            return ApiResponses.forbidden('You can only update your own books');
        }

        // Parse request body
        const updates: Partial<UserBook> = await req.json();
        
        // Remove fields that shouldn't be updated directly
        delete updates.id;
        delete updates.user_id;
        delete updates.book_id;
        delete updates.created_at;
        delete updates.updated_at;

        // Update user book
        const updatedUserBook = await updateUserBook(id, updates);
        
        return ApiResponses.ok(updatedUserBook, 'User book updated successfully');
    } catch (error) {
        console.error('Error updating user book:', error);
        if (error instanceof Error && error.message.includes('JWT')) {
            return ApiResponses.unauthorized('Invalid token');
        }
        return ApiResponses.internalServerError('Failed to update user book');
    }
}

// DELETE /api/user-books/[id] - Remove book from user's list
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Await params before accessing properties
        const { id } = await params;
        
        // Extract token from Authorization header
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return ApiResponses.unauthorized('Missing or invalid authorization header');
        }

        const token = authHeader.substring(7);
        
        // Decode and verify token
        const payload = await decode(token);
        const userId = payload.sub.toString();

        // Check if user book exists and belongs to user
        const existingUserBook = await getUserBookById(id);
        if (!existingUserBook) {
            return ApiResponses.notFound('User book not found');
        }

        if (existingUserBook.user_id !== userId) {
            return ApiResponses.forbidden('You can only remove your own books');
        }

        // Remove book from user's list
        await removeBookFromUserList(id);
        
        return ApiResponses.noContent('Book removed from user list successfully');
    } catch (error) {
        console.error('Error removing book from user list:', error);
        if (error instanceof Error && error.message.includes('JWT')) {
            return ApiResponses.unauthorized('Invalid token');
        }
        return ApiResponses.internalServerError('Failed to remove book from user list');
    }
}
