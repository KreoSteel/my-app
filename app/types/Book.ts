export interface Book {
    id: string
    title: string,
    pages: number,
    author_id: string,
    category_id: string,
    publish_date: string,
    rating: number,
    rating_count?: number,
    cover_url: string,
    annotation: string,
    created_at: string,
    updated_at: string
}