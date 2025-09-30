"use client"
import { useState, useEffect, useRef } from 'react';
import { useSearchAuthors, useCreateAuthor } from '@/app/hooks/useSearch';
import { useToast } from '@/app/components/ui/toast';
import { Search, Plus, User } from 'lucide-react';
import type { Author } from '@/app/types/Author';

interface AuthorSearchProps {
    onAuthorSelect: (author: Author) => void;
    selectedAuthor?: Author | null;
    placeholder?: string;
}

export default function AuthorSearch({ 
    onAuthorSelect, 
    selectedAuthor, 
    placeholder = "Search authors..." 
}: AuthorSearchProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newAuthorName, setNewAuthorName] = useState('');
    const [newAuthorDescription, setNewAuthorDescription] = useState('');
    const [newAuthorBirthDate, setNewAuthorBirthDate] = useState('');

    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: authors, isLoading } = useSearchAuthors(query);
    const createAuthorMutation = useCreateAuthor();
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

    // Reset form when author is selected
    useEffect(() => {
        if (selectedAuthor) {
            setQuery(selectedAuthor.full_name);
            setIsOpen(false);
        }
    }, [selectedAuthor]);

    const handleAuthorSelect = (author: Author) => {
        onAuthorSelect(author);
        setQuery(author.full_name);
        setIsOpen(false);
    };

    const handleCreateAuthor = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newAuthorName.trim()) {
            addToast({
                type: 'error',
                title: 'Validation Error',
                message: 'Author name is required'
            });
            return;
        }

        try {
            const newAuthor = await createAuthorMutation.mutateAsync({
                full_name: newAuthorName.trim(),
                description: newAuthorDescription.trim() || undefined,
                birth_date: newAuthorBirthDate || undefined
            });

            onAuthorSelect(newAuthor);
            setQuery(newAuthor.full_name);
            setShowCreateForm(false);
            setNewAuthorName('');
            setNewAuthorDescription('');
            setNewAuthorBirthDate('');

            addToast({
                type: 'success',
                title: 'Author Created!',
                message: `${newAuthor.full_name} has been added to the library.`
            });
        } catch (error) {
            console.error('Error creating author:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setIsOpen(true);
        setShowCreateForm(false);
        
        // If input is cleared, clear selection
        if (!value.trim()) {
            onAuthorSelect(null as any);
        }
    };

    const handleInputFocus = () => {
        setIsOpen(true);
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

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-2">Searching authors...</p>
                        </div>
                    ) : authors && authors.length > 0 ? (
                        <div className="py-1">
                            {authors.map((author) => (
                                <button
                                    key={author.id}
                                    onClick={() => handleAuthorSelect(author)}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
                                >
                                    <User className="w-4 h-4 text-gray-400" />
                                    <div>
                                        <div className="font-medium text-gray-900">{author.full_name}</div>
                                        {author.description && (
                                            <div className="text-sm text-gray-500 truncate">{author.description}</div>
                                        )}
                                    </div>
                                </button>
                            ))}
                            
                            {/* Create New Author Button */}
                            <div className="border-t border-gray-200">
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-blue-600"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Create new author: "{query}"</span>
                                </button>
                            </div>
                        </div>
                    ) : query.length >= 2 ? (
                        <div className="p-4 text-center text-gray-500">
                            <p>No authors found for "{query}"</p>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="mt-2 text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto"
                            >
                                <Plus className="w-4 h-4" />
                                Create new author
                            </button>
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500">
                            <p>Type at least 2 characters to search</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create Author Form */}
            {showCreateForm && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                    <form onSubmit={handleCreateAuthor} className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Author Name *
                            </label>
                            <input
                                type="text"
                                value={newAuthorName}
                                onChange={(e) => setNewAuthorName(e.target.value)}
                                placeholder="Enter author name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={newAuthorDescription}
                                onChange={(e) => setNewAuthorDescription(e.target.value)}
                                placeholder="Enter author description (optional)"
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Birth Date
                            </label>
                            <input
                                type="date"
                                value={newAuthorBirthDate}
                                onChange={(e) => setNewAuthorBirthDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                            <button
                                type="submit"
                                disabled={createAuthorMutation.isPending}
                                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {createAuthorMutation.isPending ? 'Creating...' : 'Create Author'}
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

