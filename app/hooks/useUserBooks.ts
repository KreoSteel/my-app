import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserBookWithDetails } from "@/app/types/UserBookWithDetails";
import type { UserBook } from "@/app/types/UserBook";
import type { ReadingStatus } from "@/app/types/ReadingStatus";
import apiClient from "@/lib/http";

// Get user's book list
export function useUserBooks(userId: string) {
    return useQuery({
        queryKey: ['userBooks', userId],
        queryFn: async (): Promise<UserBookWithDetails[]> => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('No access token found');
            }
            
            const response = await apiClient.get<{data: UserBookWithDetails[]}>('/user-books', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data.data;
        },
        enabled: !!userId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

// Add book to user's list
export function useAddBookToUserList() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ bookId, status }: { bookId: string; status?: ReadingStatus }) => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('No access token found');
            }
            
            const response = await apiClient.post<{data: UserBook}>('/user-books', 
                { bookId, status },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            return response.data.data;
        },
        onSuccess: (data) => {
            // Invalidate and refetch user books
            queryClient.invalidateQueries({ queryKey: ['userBooks'] });
        },
        onError: (error) => {
            console.error('Error adding book to user list:', error);
        }
    });
}

// Update user book
export function useUpdateUserBook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userBookId, updates }: { userBookId: string; updates: Partial<UserBook> }) => {
            const response = await apiClient.put<{data: UserBook}>(`/user-books/${userBookId}`, 
                updates,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                }
            );
            return response.data.data;
        },
        onSuccess: (data) => {
            // Invalidate and refetch user books
            queryClient.invalidateQueries({ queryKey: ['userBooks'] });
            // Also refresh global books so averages update in the list
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
        onError: (error) => {
            console.error('Error updating user book:', error);
        }
    });
}

// Remove book from user's list
export function useRemoveBookFromUserList() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userBookId: string) => {
            await apiClient.delete(`/user-books/${userBookId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
        },
        onSuccess: () => {
            // Invalidate and refetch user books
            queryClient.invalidateQueries({ queryKey: ['userBooks'] });
        },
        onError: (error) => {
            console.error('Error removing book from user list:', error);
        }
    });
}

// Update reading status
export function useUpdateReadingStatus() {
    const updateUserBook = useUpdateUserBook();

    return useMutation({
        mutationFn: async ({ userBookId, status }: { userBookId: string; status: ReadingStatus }) => {
            return updateUserBook.mutateAsync({ userBookId, updates: { status } });
        },
        onError: (error) => {
            console.error('Error updating reading status:', error);
        }
    });
}

// Update user rating
export function useUpdateUserRating() {
    const updateUserBook = useUpdateUserBook();

    return useMutation({
        mutationFn: async ({ userBookId, rating }: { userBookId: string; rating: number }) => {
            return updateUserBook.mutateAsync({ userBookId, updates: { rating } });
        },
        onError: (error) => {
            console.error('Error updating user rating:', error);
        }
    });
}

// Update user notes
export function useUpdateUserNotes() {
    const updateUserBook = useUpdateUserBook();

    return useMutation({
        mutationFn: async ({ userBookId, description }: { userBookId: string; description: string }) => {
            return updateUserBook.mutateAsync({ userBookId, updates: { description } });
        },
        onError: (error) => {
            console.error('Error updating user notes:', error);
        }
    });
}
