"use client"
import { useState, useEffect, useRef } from 'react';
import { useSearchBooks, useCreateBook } from '@/app/hooks/useSearch';
import { useToast } from '@/app/components/ui/toast';
import { Search, Plus, BookOpen, Calendar, Star } from 'lucide-react';
import type { BookWithDetails } from '@/app/types/BookWithDetails';
import type { Author } from '@/app/types/Author';

interface BookSearchProps {
    onBookSelect: (book: BookWithDetails) => void;
    selectedAuthor?: Author | null;
    placeholder?: string;
}

export default function BookSearch({ 
    onBookSelect, 
    selectedAuthor, 
    placeholder = "Search books..." 
}: BookSearchProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newBookData, setNewBookData] = useState({
        title: '',
        pages: '',
        publish_date: '',
        rating: '',
        cover_url: '',
        annotation: ''
    });

    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: books, isLoading } = useSearchBooks(query, selectedAuthor?.id);
    const createBookMutation = useCreateBook();
    const { addToast } = useToast();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowCreateForm(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBookSelect = (book: BookWithDetails) => {
        onBookSelect(book);
        setQuery(book.title);
        setIsOpen(false);
    };

    const handleCreateBook = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newBookData.title.trim() || !selectedAuthor) {
            addToast({
                type: 'error',
                title: 'Validation Error',
                message: 'Book title and author are required'
            });
            return;
        }

        try {
            const bookData = {
                title: newBookData.title.trim(),
                pages: newBookData.pages ? parseInt(newBookData.pages) : undefined,
                author_id: selectedAuthor.id,
                category_id: 'default-category-id', // You might want to add category selection
                publish_date: newBookData.publish_date || undefined,
                rating: newBookData.rating ? parseFloat(newBookData.rating) : undefined,
                cover_url: newBookData.cover_url.trim() || undefined,
                annotation: newBookData.annotation.trim() || undefined
            };

            const newBook = await createBookMutation.mutateAsync(bookData);

            // Convert to BookWithDetails format
            const bookWithDetails: BookWithDetails = {
                ...newBook,
                author: {
                    id: selectedAuthor.id,
                    full_name: selectedAuthor.full_name
                }
            };

            onBookSelect(bookWithDetails);
            setQuery(newBook.title);
            setShowCreateForm(false);
            setNewBookData({
                title: '',
                pages: '',
                publish_date: '',
                rating: '',
                cover_url: '',
                annotation: ''
            });

            addToast({
                type: 'success',
                title: 'Book Created!',
                message: `${newBook.title} has been added to the library.`
            });
        } catch (error) {
            console.error('Error creating book:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setIsOpen(true);
        setShowCreateForm(false);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short'
        });
    };

    const renderStars = (rating: number | undefined) => {
        if (!rating) return null;
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return (
            <div className="flex items-center gap-1">
                {[...Array(fullStars)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xs">★</span>
                ))}
                {hasHalfStar && <span className="text-yellow-400 text-xs">☆</span>}
                {[...Array(emptyStars)].map((_, i) => (
                    <span key={i} className="text-gray-300 text-xs">☆</span>
                ))}
            </div>
        );
    };

    return (
        <div ref={searchRef} className="relative w-full">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Author Filter */}
            {selectedAuthor && (
                <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Filtered by author:</span> {selectedAuthor.full_name}
                </div>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-2">Searching books...</p>
                        </div>
                    ) : books && books.length > 0 ? (
                        <div className="py-1">
                            {books.map((book) => (
                                <button
                                    key={book.id}
                                    onClick={() => handleBookSelect(book)}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-start gap-3"
                                >
                                    <BookOpen className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 truncate">{book.title}</div>
                                        <div className="text-sm text-gray-500">
                                            by {book.author?.full_name || 'Unknown Author'}
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                                            {book.pages && (
                                                <span className="flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3" />
                                                    {book.pages} pages
                                                </span>
                                            )}
                                            {book.publish_date && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(book.publish_date)}
                                                </span>
                                            )}
                                            {book.rating && (
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-3 h-3" />
                                                    {book.rating.toFixed(1)}
                                                    {renderStars(book.rating)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                            
                            {/* Create New Book Button */}
                            <div className="border-t border-gray-200">
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-blue-600"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Create new book: "{query}"</span>
                                </button>
                            </div>
                        </div>
                    ) : query.length >= 2 ? (
                        <div className="p-4 text-center text-gray-500">
                            <p>No books found for "{query}"</p>
                            {selectedAuthor && (
                                <p className="text-sm mt-1">by {selectedAuthor.full_name}</p>
                            )}
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="mt-2 text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto"
                            >
                                <Plus className="w-4 h-4" />
                                Create new book
                            </button>
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500">
                            <p>Type at least 2 characters to search</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create Book Form */}
            {showCreateForm && selectedAuthor && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                    <form onSubmit={handleCreateBook} className="space-y-3">
                        <div className="text-sm text-gray-600 mb-3">
                            Creating book by <span className="font-medium">{selectedAuthor.full_name}</span>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Book Title *
                            </label>
                            <input
                                type="text"
                                value={newBookData.title}
                                onChange={(e) => setNewBookData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter book title"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pages
                                </label>
                                <input
                                    type="number"
                                    value={newBookData.pages}
                                    onChange={(e) => setNewBookData(prev => ({ ...prev, pages: e.target.value }))}
                                    placeholder="Number of pages"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Publish Date
                                </label>
                                <input
                                    type="date"
                                    value={newBookData.publish_date}
                                    onChange={(e) => setNewBookData(prev => ({ ...prev, publish_date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rating
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="5"
                                    value={newBookData.rating}
                                    onChange={(e) => setNewBookData(prev => ({ ...prev, rating: e.target.value }))}
                                    placeholder="0.0 - 5.0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cover URL
                                </label>
                                <input
                                    type="url"
                                    value={newBookData.cover_url}
                                    onChange={(e) => setNewBookData(prev => ({ ...prev, cover_url: e.target.value }))}
                                    placeholder="Image URL"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={newBookData.annotation}
                                onChange={(e) => setNewBookData(prev => ({ ...prev, annotation: e.target.value }))}
                                placeholder="Enter book description (optional)"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                            <button
                                type="submit"
                                disabled={createBookMutation.isPending}
                                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {createBookMutation.isPending ? 'Creating...' : 'Create Book'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

