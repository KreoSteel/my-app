import { useQuery } from "@tanstack/react-query";
import type { BookWithDetails } from "@/app/types/BookWithDetails";
import type { BookFilters } from "@/app/types/BookFilters";
import apiClient from "@/lib/http";
import { Pagination } from "../types/Pagination";

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

export function useBooks(filters?: BookFilters, page: number = 1, limit: number = 10, extraParams?: Record<string, string | number | undefined>) {
    return useQuery({
        queryKey: ["books", filters, page, limit, extraParams],
        queryFn: async () => {
            const hasQ = !!filters?.query && filters.query.trim().length > 0;
            const onlyQ = hasQ && !filters?.minRating && !filters?.minPages && !filters?.maxPages;

            if (onlyQ) {
                // Unpaginated global search path
                const params = new URLSearchParams();
                params.set('q', filters!.query!.trim());
                // Soft cap results if caller provided a searchLimit in extraParams; default to limit
                params.set('limit', String((extraParams as any)?.searchLimit ?? limit));

                const searchResp = await apiClient.get<{ data: BookWithDetails[] }>(`/search/books?${params.toString()}`);
                const books = searchResp.data.data;
                return { data: books } as { data: BookWithDetails[]; pagination?: Pagination };
            }

            // Paginated listing path
            const qs = toQueryString(filters);
            const pagedResp = await apiClient.get<{ data: { data: BookWithDetails[]; pagination: Pagination } }>(
                `/books${qs}`,
                { params: { page, limit, ...extraParams } }
            );
            return pagedResp.data.data; // { data, pagination }
        },
    });
}
