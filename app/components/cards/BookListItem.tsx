import type { BookWithDetails } from "@/app/types/BookWithDetails"
import Image from "next/image"
import { ChevronDownIcon, Plus, Check } from "lucide-react"
import { useAddBookToUserList } from "@/app/hooks/useUserBooks"
import { useToast } from "@/app/components/ui/toast"
import { useState } from "react"

interface BookListItemProps {
    item: Partial<BookWithDetails>
    isOpen: boolean
    onToggle: () => void
}

export default function BookListItem({ item: book, isOpen, onToggle }: BookListItemProps) {
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

    const handleAddToMyList = async (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent accordion toggle
        
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
        <div className="border border-border/20 rounded-lg overflow-hidden bg-foreground shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Accordion Header */}
            <div className="p-6">
                <div className="flex items-center gap-4">
                    {/* Book Cover */}
                    <div className="relative w-16 h-24 rounded-md overflow-hidden shadow-sm flex-shrink-0">
                        <Image 
                            placeholder="empty" 
                            src={book.cover_url || "/placeholder-book.jpg"} 
                            alt={book.title || "Book cover"} 
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* Book Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-background truncate">
                                    {book.title || 'Unknown Title'}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    {book.author && (
                                        <span className="text-sm text-background/70">
                                            by {book.author.full_name}
                                        </span>
                                    )}
                                    {book.category && (
                                        <span className="inline-block px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full">
                                            {book.category.title}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm text-background/60">
                                    <span>{book.pages ? `${book.pages} pages` : 'Pages unknown'}</span>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                        <span>{formatRating(book.rating)}</span>
                                        {renderStars(book.rating)}
                                        {typeof book.rating_count === 'number' && (
                                            <span className="ml-1">({book.rating_count} ratings)</span>
                                        )}
                                    </div>
                                    <span>•</span>
                                    <span>Published: {formatDate(book.publish_date)}</span>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                {/* Add to My List Button */}
                                <button
                                    onClick={handleAddToMyList}
                                    disabled={isAdded || addBookMutation.isPending}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        isAdded 
                                            ? 'bg-green-100 text-green-700 cursor-not-allowed' 
                                            : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
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
                                            Added
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Add to My List
                                        </>
                                    )}
                                </button>
                                
                                {/* Toggle Button */}
                                <button
                                    onClick={onToggle}
                                    className="p-2 hover:bg-background/10 rounded-md transition-colors"
                                >
                                    <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                                        <ChevronDownIcon className="w-5 h-5 text-background/60" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Accordion Content */}
            {isOpen && (
                <div className="px-6 pb-6 border-t border-border/10">
                    <div className="pt-4 space-y-4">
                        {book.annotation && (
                            <div className="text-sm text-background/80 leading-relaxed">
                                <p className="font-medium text-background mb-2">Description:</p>
                                <p>{book.annotation}</p>
                            </div>
                        )}
                        
                        {/* Add to My List Button in expanded view */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleAddToMyList}
                                disabled={isAdded || addBookMutation.isPending}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    isAdded 
                                        ? 'bg-green-100 text-green-700 cursor-not-allowed' 
                                        : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
                                }`}
                            >
                                {addBookMutation.isPending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Adding to My List...
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
                </div>
            )}
        </div>
    )
}
