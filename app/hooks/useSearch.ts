import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BookWithDetails } from "@/app/types/BookWithDetails";
import type { Author } from "@/app/types/Author";
import type { Book } from "@/app/types/Book";
import apiClient from "@/lib/http";

// Search books
export function useSearchBooks(query: string, authorId?: string, limit: number = 10) {
    return useQuery({
        queryKey: ['searchBooks', query, authorId, limit],
        queryFn: async (): Promise<BookWithDetails[]> => {
            if (!query || query.length < 2) return [];
            
            const params = new URLSearchParams({
                q: query,
                limit: limit.toString()
            });
            
            if (authorId) {
                params.append('authorId', authorId);
            }
            
            const response = await apiClient.get<{data: BookWithDetails[]}>(`/search/books?${params}`);
            return response.data.data;
        },
        enabled: query.length >= 2,
        staleTime: 30 * 1000, // 30 seconds
        cacheTime: 5 * 60 * 1000, // 5 minutes
    });
}

// Search authors
export function useSearchAuthors(query: string, limit: number = 10) {
    return useQuery({
        queryKey: ['searchAuthors', query, limit],
        queryFn: async (): Promise<Author[]> => {
            if (!query || query.length < 2) return [];
            
            const params = new URLSearchParams({
                q: query,
                limit: limit.toString()
            });
            
            const response = await apiClient.get<{data: Author[]}>(`/search/authors?${params}`);
            return response.data.data;
        },
        enabled: query.length >= 2,
        staleTime: 30 * 1000, // 30 seconds
        cacheTime: 5 * 60 * 1000, // 5 minutes
    });
}

// Create book
export function useCreateBook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (bookData: {
            title: string;
            pages?: number;
            author_id: string;
            category_id: string;
            publish_date?: string;
            rating?: number;
            cover_url?: string;
            annotation?: string;
        }) => {
            const response = await apiClient.post<{data: Book}>('/books/create', bookData);
            return response.data.data;
        },
        onSuccess: () => {
            // Invalidate and refetch books list
            queryClient.invalidateQueries({ queryKey: ['books'] });
            queryClient.invalidateQueries({ queryKey: ['searchBooks'] });
        },
        onError: (error) => {
            console.error('Error creating book:', error);
        }
    });
}

// Create author
export function useCreateAuthor() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (authorData: {
            full_name: string;
            description?: string;
            birth_date?: string;
        }) => {
            const response = await apiClient.post<{data: Author}>('/authors/create', authorData);
            return response.data.data;
        },
        onSuccess: () => {
            // Invalidate and refetch authors list
            queryClient.invalidateQueries({ queryKey: ['authors'] });
            queryClient.invalidateQueries({ queryKey: ['searchAuthors'] });
        },
        onError: (error) => {
            console.error('Error creating author:', error);
        }
    });
}

