import { useQuery } from "@tanstack/react-query";
import type { BookWithDetails } from "@/app/types/BookWithDetails";
import type { BookFilters } from "@/app/types/BookFilters";
import apiClient from "@/lib/http";

// Convert filters to query string
function toQueryString(filters?: BookFilters) {
    if (!filters) return "";
    const cleaned: Record<string, string> = {};
    for (const [key, val] of Object.entries(filters)) {
        if (val === undefined || val === null || val === "") continue;
        if (typeof val === "number" && val <= 0) continue; // drop 0
        cleaned[key] = String(val);
    }
    const qs = new URLSearchParams(cleaned).toString();
    return qs ? `?${qs}` : "";
}

export function useBooks(filters?: BookFilters) {
    return useQuery({
        queryKey: ["books", filters],
        queryFn: async () => {
            const hasQ = !!filters?.query && filters.query.trim().length > 0;
            const onlyQ =
                hasQ && !filters?.minRating && !filters?.minPages && !filters?.maxPages;
            const basePath = onlyQ ? "/search/books" : "/books";
            const qs = onlyQ
                ? (() => { const p = new URLSearchParams(); p.set('q', filters!.query!); return `?${p.toString()}`; })()
                : toQueryString(filters);
            const response = await apiClient.get<{ data: BookWithDetails[] }>(
                `${basePath}${qs}`
            );
            return response.data.data;
        },
    });
}
