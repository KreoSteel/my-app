 import apiClient, { api } from "@/lib/http"
import type { Author } from "@/app/types/Author"
import { useQuery } from "@tanstack/react-query"

export async function createAuthor(author: Partial<Author>): Promise<Author> {
    const newAuthor = await api.post<Author>('/authors', {
        full_name: author.full_name,
        description: author.description,
        birth_date: author.birth_date
    })
    return newAuthor
}

export function useAuthors() {
    return useQuery({
        queryKey: ['authors'],   
        queryFn: async () => {
            const response = await apiClient.get<{data: Author[]}>('/authors')
            return response.data.data
        }
    })
}