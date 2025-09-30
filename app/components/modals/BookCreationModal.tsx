"use client"
import { useState } from 'react';
import { X, BookOpen, User, Check } from 'lucide-react';
import AuthorSearch from '@/app/components/forms/AuthorSearch';
import BookSearch from '@/app/components/forms/BookSearch';
import { useAddBookToUserList } from '@/app/hooks/useUserBooks';
import { useToast } from '@/app/components/ui/toast';
import type { Author } from '@/app/types/Author';
import type { BookWithDetails } from '@/app/types/BookWithDetails';

interface BookCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BookCreationModal({ isOpen, onClose }: BookCreationModalProps) {
    const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
    const [selectedBook, setSelectedBook] = useState<BookWithDetails | null>(null);
    const [step, setStep] = useState<'author' | 'book'>('author');

    const addBookMutation = useAddBookToUserList();
    const { addToast } = useToast();

    const handleAuthorSelect = (author: Author | null) => {
        setSelectedAuthor(author);
        setSelectedBook(null);
        if (author) {
            setStep('book');
        }
    };

    const handleBookSelect = (book: BookWithDetails) => {
        setSelectedBook(book);
    };

    const handleAddToMyList = async () => {
        if (!selectedBook) return;

        try {
            await addBookMutation.mutateAsync({ bookId: selectedBook.id });
            addToast({
                type: 'success',
                title: 'Book Added!',
                message: `${selectedBook.title} has been added to your reading list.`
            });
            onClose();
            resetForm();
        } catch (error) {
            console.error('Error adding book to list:', error);
            addToast({
                type: 'error',
                title: 'Failed to Add Book',
                message: 'There was an error adding the book to your list. Please try again.'
            });
        }
    };

    const resetForm = () => {
        setSelectedAuthor(null);
        setSelectedBook(null);
        setStep('author');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
            
            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                            <h2 className="text-xl font-semibold text-gray-900">Add Book to My List</h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Progress Steps */}
                        <div className="flex items-center justify-center mb-8">
                            <div className="flex items-center gap-4">
                                {/* Author Step */}
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                                    step === 'author' ? 'bg-blue-100 text-blue-700' : 
                                    selectedAuthor ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    <User className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        {selectedAuthor ? 'Author Selected' : '1. Select Author'}
                                    </span>
                                    {selectedAuthor && <Check className="w-4 h-4" />}
                                </div>
                                
                                <div className={`w-8 h-0.5 ${selectedAuthor ? 'bg-green-400' : 'bg-gray-300'}`} />
                                
                                {/* Book Step */}
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                                    step === 'book' ? 'bg-blue-100 text-blue-700' : 
                                    selectedBook ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    <BookOpen className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        {selectedBook ? 'Book Selected' : '2. Select Book'}
                                    </span>
                                    {selectedBook && <Check className="w-4 h-4" />}
                                </div>
                            </div>
                        </div>

                        {/* Author Selection */}
                        {step === 'author' && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Search for an Author
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Start typing to search for an author. If the author doesn't exist, you can create a new one.
                                    </p>
                                </div>
                                
                                <AuthorSearch
                                    onAuthorSelect={handleAuthorSelect}
                                    selectedAuthor={selectedAuthor}
                                    placeholder="Search authors by name..."
                                />
                                
                                {selectedAuthor && (
                                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <User className="w-5 h-5 text-green-600" />
                                            <div>
                                                <div className="font-medium text-green-800">
                                                    {selectedAuthor.full_name}
                                                </div>
                                                {selectedAuthor.description && (
                                                    <div className="text-sm text-green-600">
                                                        {selectedAuthor.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Book Selection */}
                        {step === 'book' && selectedAuthor && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">
                                            Search for a Book
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Books by <span className="font-medium">{selectedAuthor.full_name}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setStep('author')}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Change Author
                                    </button>
                                </div>
                                
                                <BookSearch
                                    onBookSelect={handleBookSelect}
                                    selectedAuthor={selectedAuthor}
                                    placeholder="Search books by title..."
                                />
                                
                                {selectedBook && (
                                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            {selectedBook.cover_url && (
                                                <img
                                                    src={selectedBook.cover_url}
                                                    alt={selectedBook.title}
                                                    className="w-12 h-16 object-cover rounded"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <div className="font-medium text-green-800">
                                                    {selectedBook.title}
                                                </div>
                                                <div className="text-sm text-green-600">
                                                    by {selectedBook.author?.full_name}
                                                </div>
                                                {selectedBook.pages && (
                                                    <div className="text-xs text-green-600 mt-1">
                                                        {selectedBook.pages} pages
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            
                            {selectedBook && (
                                <button
                                    onClick={handleAddToMyList}
                                    disabled={addBookMutation.isPending}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {addBookMutation.isPending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <BookOpen className="w-4 h-4" />
                                            Add to My List
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
