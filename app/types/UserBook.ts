import type { ReadingStatus } from "./ReadingStatus"

export interface UserBook {
    id: string
    user_id: string
    book_id: string
    rating?: number
    description?: string
    status?: ReadingStatus
    started_at?: string
    finished_at?: string
    created_at: string
    updated_at: string
}
