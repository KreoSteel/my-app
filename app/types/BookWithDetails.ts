import type { Book } from "./Book"
import type { Author } from "./Author"
import type { Category } from "./Category"

export interface BookWithDetails extends Book {
    author?: Pick<Author, 'id' | 'full_name'>
    category?: Pick<Category, 'id' | 'title'>
}
