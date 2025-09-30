import type { UserBook } from "./UserBook"
import type { BookWithDetails } from "./BookWithDetails"

export interface UserBookWithDetails extends UserBook {
    book: BookWithDetails
}
