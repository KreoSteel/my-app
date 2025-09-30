"use client"
import { useState } from "react"
import Section from "@/app/components/layouts/Section"
import { useBooks } from "@/app/services/books"
import BookListItem from "@/app/components/cards/BookListItem"
import BookCard from "@/app/components/cards/BookCard"
import AccordionList from "@/app/components/layouts/AccordionList"
import ReusableList from "@/app/components/layouts/ReusableList"
import type { BookFilters } from "@/app/types/BookFilters"
import BooksFilter from "@/app/components/forms/BooksFilter"
import { Grid3X3, List } from "lucide-react"

export default function BooksPage() {
    const [filters, setFilters] = useState<BookFilters>({} as BookFilters)
    const { data: books, isLoading: booksLoading, error: booksError } = useBooks(filters)
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

    return (
        <Section>
            <div className="space-y-8">
                {/* Page Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-foreground">
                        Our Book Collection
                    </h1>
                    <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                        Discover our curated collection of books from various authors and genres. 
                        Click on any book to read its description and learn more.
                    </p>
                    <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto"></div>
                </div>

                {/* Books List */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-semibold text-foreground">
                            All Books
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-foreground/60">
                                {books ? `${books.length} book${books.length !== 1 ? 's' : ''}` : '0 books'}
                            </div>
                            
                            {/* View Toggle */}
                            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        viewMode === 'list' 
                                            ? 'bg-background text-foreground shadow-sm' 
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <List className="w-4 h-4" />
                                    List
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        viewMode === 'grid' 
                                            ? 'bg-background text-foreground shadow-sm' 
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                    Grid
                                </button>
                            </div>
                        </div>
                    </div>

                    <BooksFilter value={filters} onChange={setFilters} />
                    
                    {/* Books Display */}
                    {viewMode === 'list' ? (
                        <AccordionList 
                            items={books || []} 
                            error={booksError} 
                            isLoading={booksLoading} 
                            ListItemComponent={BookListItem} 
                            getItemKey={(item) => item.id}
                        />
                    ) : (
                        <ReusableList 
                            items={books || []} 
                            error={booksError} 
                            isLoading={booksLoading} 
                            CardComponent={BookCard} 
                            getItemKey={(item) => item.id}
                            layout="grid"
                            gridCols="3"
                        />
                    )}
                </div>
            </div>
        </Section>
    )
}