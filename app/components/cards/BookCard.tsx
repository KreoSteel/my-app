import type { BookWithDetails } from "@/app/types/BookWithDetails"
import Image from "next/image"
import { Plus, Check } from "lucide-react"
import { useAddBookToUserList } from "@/app/hooks/useUserBooks"
import { useToast } from "@/app/components/ui/toast"
import { useState } from "react"

export default function BookCard({ item: book }: { item: Partial<BookWithDetails> }) {
    const [isAdded, setIsAdded] = useState(false)
    const addBookMutation = useAddBookToUserList()
    const { addToast } = useToast()

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatRating = (rating: number | undefined) => {
        if (!rating) return 'N/A'
        return rating.toFixed(1)
    }

    const renderStars = (rating: number | undefined) => {
        if (!rating) return null
        const fullStars = Math.floor(rating)
        const hasHalfStar = rating % 1 >= 0.5
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
        
        return (
            <div className="flex items-center gap-1">
                {[...Array(fullStars)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                ))}
                {hasHalfStar && <span className="text-yellow-400">☆</span>}
                {[...Array(emptyStars)].map((_, i) => (
                    <span key={i} className="text-gray-300">☆</span>
                ))}
            </div>
        )
    }

    const handleAddToMyList = async () => {
        if (!book.id) return
        
        try {
            await addBookMutation.mutateAsync({ bookId: book.id })
            setIsAdded(true)
            addToast({
                type: 'success',
                title: 'Book Added!',
                message: `${book.title} has been added to your reading list.`
            })
        } catch (error) {
            console.error('Error adding book to list:', error)
            addToast({
                type: 'error',
                title: 'Failed to Add Book',
                message: 'There was an error adding the book to your list. Please try again.'
            })
        }
    }

    return (
        <div className="group p-6 flex flex-col gap-4 bg-foreground rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-border/20">
            {/* Book Cover */}
            <div className="flex justify-center mb-2">
                <div className="relative w-32 h-48 rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-shadow duration-300">
                    <Image 
                        placeholder="empty" 
                        src={book.cover_url || "/placeholder-book.jpg"} 
                        alt={book.title || "Book cover"} 
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
            </div>

            {/* Book Title */}
            <div className="flex flex-col gap-2 text-center">
                <h2 className="text-xl text-background font-bold group-hover:text-primary transition-colors duration-200 line-clamp-2">
                    {book.title || 'Unknown Title'}
                </h2>
                <div className="w-12 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto"></div>
            </div>

            {/* Author and Category */}
            <div className="flex flex-col gap-2 text-center">
                {book.author && (
                    <div className="text-sm text-background/90 font-medium">
                        by {book.author.full_name}
                    </div>
                )}
                {book.category && (
                    <div className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full">
                        {book.category.title}
                    </div>
                )}
            </div>

            {/* Book Annotation */}
            {book.annotation && (
                <div className="text-sm text-background/80 leading-relaxed line-clamp-4 text-center">
                    {book.annotation}
                </div>
            )}

            {/* Book Metadata */}
            <div className="flex flex-col gap-2 text-sm text-background/70">
                {/* Pages and Rating in one row */}
                <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                        <span className="font-medium">
                            {book.pages ? `${book.pages} pages` : 'Pages unknown'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                        <div className="flex items-center gap-1">
                            <span className="font-medium">
                                {formatRating(book.rating)}
                            </span>
                            {renderStars(book.rating)}
                            {typeof book.rating_count === 'number' && (
                                <span className="ml-1">({book.rating_count} ratings)</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Publish Date */}
                <div className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                    <span className="font-medium">
                        Published: {formatDate(book.publish_date)}
                    </span>
                </div>
            </div>

            {/* Add to My List Button */}
            <div className="mt-4">
                <button
                    onClick={handleAddToMyList}
                    disabled={isAdded || addBookMutation.isPending}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isAdded 
                            ? 'bg-green-100 text-green-700 cursor-not-allowed' 
                            : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 hover:shadow-md'
                    }`}
                >
                    {addBookMutation.isPending ? (
                        <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Adding...
                        </>
                    ) : isAdded ? (
                        <>
                            <Check className="w-4 h-4" />
                            Added to My List
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4" />
                            Add to My List
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}