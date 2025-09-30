"use client"
import { useState } from "react";
import Section from "@/app/components/layouts/Section";
import { useAuth } from "@/app/hooks/useAuth";
import { useUserBooks } from "@/app/hooks/useUserBooks";
import UserBookCard from "@/app/components/cards/UserBookCard";
import BookCreationModal from "@/app/components/modals/BookCreationModal";
import { ReadingStatus } from "@/app/types/ReadingStatus";
import type { UserBookWithDetails } from "@/app/types/UserBookWithDetails";
import { Plus } from "lucide-react";

export default function MyListPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [statusFilter, setStatusFilter] = useState<ReadingStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);

    const { 
        data: userBooks, 
        isLoading: booksLoading, 
        error: booksError 
    } = useUserBooks(user?.sub?.toString() || '');

    // Type assertion to help TypeScript understand the data type
    const typedUserBooks = userBooks as UserBookWithDetails[] | undefined;

    // Filter books based on status and search query
    const filteredBooks = typedUserBooks?.filter((userBook: UserBookWithDetails) => {
        const matchesStatus = statusFilter === 'all' || userBook.status === statusFilter;
        const matchesSearch = searchQuery === '' || 
            userBook.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            userBook.book.author?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            userBook.book.category?.title.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesStatus && matchesSearch;
    }) || [];

    const getStatusCounts = () => {
        if (!typedUserBooks) return {};
        
        return typedUserBooks.reduce((counts: Record<string, number>, userBook: UserBookWithDetails) => {
            const status = userBook.status || 'not_set';
            counts[status] = (counts[status] || 0) + 1;
            return counts;
        }, {} as Record<string, number>);
    };

    const statusCounts = getStatusCounts();

    if (authLoading) {
        return (
            <Section>
                <div className="flex items-center justify-center min-h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your book list...</p>
                    </div>
                </div>
            </Section>
        );
    }

    if (!user) {
        return (
            <Section>
                <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
                    <p className="text-gray-600">Please log in to view your book list.</p>
                </div>
            </Section>
        );
    }

    return (
        <Section>
            <div className="space-y-8">
                {/* Page Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-foreground">
                        My Reading List
                    </h1>
                    <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                        Track your reading progress, rate books, and add personal notes to your collection.
                    </p>
                    <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto"></div>
                </div>

                {/* Stats Overview */}
                {typedUserBooks && typedUserBooks.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {statusCounts[ReadingStatus.TO_READ] || 0}
                            </div>
                            <div className="text-sm text-blue-800">To Read</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                                {statusCounts[ReadingStatus.READING] || 0}
                            </div>
                            <div className="text-sm text-yellow-800">Reading</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {statusCounts[ReadingStatus.COMPLETED] || 0}
                            </div>
                            <div className="text-sm text-green-800">Completed</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-gray-600">
                                {typedUserBooks?.length || 0}
                            </div>
                            <div className="text-sm text-gray-800">Total Books</div>
                        </div>
                    </div>
                )}

                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search books, authors, or categories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsBookModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Book
                        </button>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as ReadingStatus | 'all')}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value={ReadingStatus.TO_READ}>To Read</option>
                            <option value={ReadingStatus.READING}>Reading</option>
                            <option value={ReadingStatus.COMPLETED}>Completed</option>
                            <option value={ReadingStatus.ABANDONED}>Abandoned</option>
                        </select>
                    </div>
                </div>

                {/* Books List */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-semibold text-foreground">
                            Your Books
                        </h2>
                        <div className="text-sm text-foreground/60">
                            {filteredBooks.length} of {typedUserBooks?.length || 0} books
                        </div>
                    </div>

                    {booksLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                                    <div className="h-8 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : booksError ? (
                        <div className="text-center py-12">
                            <div className="text-red-500 text-lg font-semibold mb-2">
                                Error loading your books
                            </div>
                            <p className="text-gray-600">
                                {booksError instanceof Error ? booksError.message : 'Something went wrong'}
                            </p>
                        </div>
                    ) : filteredBooks.length === 0 ? (
                        <div className="text-center py-12">
                            {typedUserBooks?.length === 0 ? (
                                <>
                                    <div className="text-6xl mb-4">📚</div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        Your reading list is empty
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Start building your collection by adding books from our catalog.
                                    </p>
                                    <button className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                                        Browse Books
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="text-6xl mb-4">🔍</div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        No books match your filters
                                    </h3>
                                    <p className="text-gray-600">
                                        Try adjusting your search or filter criteria.
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredBooks.map((userBook: UserBookWithDetails) => (
                                <UserBookCard key={userBook.id} userBook={userBook} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Book Creation Modal */}
            <BookCreationModal
                isOpen={isBookModalOpen}
                onClose={() => setIsBookModalOpen(false)}
            />
        </Section>
    );
}
