import { useState } from 'react';
import type { UserBookWithDetails } from '@/app/types/UserBookWithDetails';
import { ReadingStatus } from '@/app/types/ReadingStatus';
import { useUpdateReadingStatus, useUpdateUserRating, useRemoveBookFromUserList } from '@/app/hooks/useUserBooks';

interface UserBookCardProps {
    userBook: UserBookWithDetails;
}

export default function UserBookCard({ userBook }: UserBookCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [rating, setRating] = useState(userBook.rating || 0);
    const [notes, setNotes] = useState(userBook.description || '');

    const updateStatusMutation = useUpdateReadingStatus();
    const updateRatingMutation = useUpdateUserRating();
    const removeMutation = useRemoveBookFromUserList();

    const handleStatusChange = (newStatus: ReadingStatus) => {
        updateStatusMutation.mutate({ 
            userBookId: userBook.id, 
            status: newStatus 
        });
    };

    const handleRatingChange = (newRating: number) => {
        setRating(newRating);
        updateRatingMutation.mutate({ 
            userBookId: userBook.id, 
            rating: newRating 
        });
    };

    const handleRemove = () => {
        if (confirm('Are you sure you want to remove this book from your list?')) {
            removeMutation.mutate(userBook.id);
        }
    };

    const getStatusColor = (status?: ReadingStatus) => {
        switch (status) {
            case ReadingStatus.TO_READ:
                return 'bg-blue-100 text-blue-800';
            case ReadingStatus.READING:
                return 'bg-yellow-100 text-yellow-800';
            case ReadingStatus.COMPLETED:
                return 'bg-green-100 text-green-800';
            case ReadingStatus.ABANDONED:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status?: ReadingStatus) => {
        switch (status) {
            case ReadingStatus.TO_READ:
                return 'To Read';
            case ReadingStatus.READING:
                return 'Reading';
            case ReadingStatus.COMPLETED:
                return 'Completed';
            case ReadingStatus.ABANDONED:
                return 'Abandoned';
            default:
                return 'Not Set';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {userBook.book.title}
                    </h3>
                    {userBook.book.author && (
                        <p className="text-gray-600 mb-1">
                            by {userBook.book.author.full_name}
                        </p>
                    )}
                    {userBook.book.category && (
                        <p className="text-sm text-gray-500 mb-2">
                            {userBook.book.category.title}
                        </p>
                    )}
                </div>
                <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(userBook.status)}`}>
                        {getStatusLabel(userBook.status)}
                    </span>
                    {userBook.book.cover_url && (
                        <img 
                            src={userBook.book.cover_url} 
                            alt={userBook.book.title}
                            className="w-16 h-20 object-cover rounded"
                        />
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {/* Reading Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reading Status
                    </label>
                    <select
                        value={userBook.status || ''}
                        onChange={(e) => handleStatusChange(e.target.value as ReadingStatus)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={updateStatusMutation.isPending}
                    >
                        <option value="">Select Status</option>
                        <option value={ReadingStatus.TO_READ}>To Read</option>
                        <option value={ReadingStatus.READING}>Reading</option>
                        <option value={ReadingStatus.COMPLETED}>Completed</option>
                        <option value={ReadingStatus.ABANDONED}>Abandoned</option>
                    </select>
                </div>

                {/* User Rating */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Rating
                    </label>
                    <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => handleRatingChange(star)}
                                className={`text-2xl ${
                                    star <= rating 
                                        ? 'text-yellow-400' 
                                        : 'text-gray-300'
                                } hover:text-yellow-400 transition-colors`}
                                disabled={updateRatingMutation.isPending}
                            >
                                ★
                            </button>
                        ))}
                        <span className="text-sm text-gray-600 ml-2">
                            {rating > 0 ? `${rating}/5` : 'Not rated'}
                        </span>
                    </div>
                </div>

                {/* User Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Notes
                    </label>
                    {isEditing ? (
                        <div className="space-y-2">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Add your thoughts about this book..."
                            />
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        // TODO: Implement update notes mutation
                                        setIsEditing(false);
                                    }}
                                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {userBook.description ? (
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                                    {userBook.description}
                                </p>
                            ) : (
                                <p className="text-gray-500 italic">No notes added yet</p>
                            )}
                            <button
                                onClick={() => setIsEditing(true)}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                            >
                                {userBook.description ? 'Edit notes' : 'Add notes'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    {userBook.started_at && (
                        <div>
                            <span className="font-medium">Started:</span> {new Date(userBook.started_at).toLocaleDateString()}
                        </div>
                    )}
                    {userBook.finished_at && (
                        <div>
                            <span className="font-medium">Finished:</span> {new Date(userBook.finished_at).toLocaleDateString()}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <button
                        onClick={handleRemove}
                        className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                        disabled={removeMutation.isPending}
                    >
                        {removeMutation.isPending ? 'Removing...' : 'Remove from List'}
                    </button>
                </div>
            </div>
        </div>
    );
}
