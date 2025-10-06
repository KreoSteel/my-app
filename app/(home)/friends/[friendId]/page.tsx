"use client";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getFriendProfile, type FriendProfileResponse } from '@/app/services/friends';
import type { UserBookWithDetails } from '@/app/types/UserBookWithDetails';

export default function FriendProfilePage() {
  const params = useParams<{ friendId: string }>();
  const friendId = params?.friendId;

  const [data, setData] = useState<FriendProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!friendId) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await getFriendProfile(friendId);
      setData(resp);
    } catch (err: any) {
      setError(err?.apiMessage || err?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [friendId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <div className="h-8 w-40 bg-muted/40 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-muted/40 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 bg-muted/40 rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted/40 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-24 bg-muted/40 rounded animate-pulse" />
          <div className="h-24 bg-muted/40 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/friends" className="text-sm text-muted-foreground hover:underline">← Back to friends</Link>
        </div>
        <div className="p-4 border rounded bg-red-50 text-red-700" role="alert">
          {error}
        </div>
        <button onClick={load} className="mt-4 px-3 py-2 bg-blue-600 text-white rounded">Retry</button>
      </div>
    );
  }

  if (!data) return <div className="p-6">No data</div>;

  const { profile, books } = data;
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <Link href="/friends" className="text-sm text-muted-foreground hover:underline">← Back to friends</Link>
      </div>
      <div className="flex items-center gap-4 mb-6">
        {profile.avatar_url && (
          // Use next/image in your real UI
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt={profile.full_name} className="w-16 h-16 rounded-full" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile.full_name}</h1>
          {profile.member_since && (
            <p className="text-sm text-gray-500">Member since {new Date(profile.member_since).toLocaleDateString()}</p>
          )}
          {typeof profile.age === 'number' && (
            <p className="text-sm text-gray-500">Age {profile.age}</p>
          )}
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-2">Books</h2>
      {books.length === 0 ? (
        <div className="text-gray-500">No books to show</div>
      ) : (
        <ul className="space-y-3">
          {books.map((ub: UserBookWithDetails) => (
            <li key={ub.id} className="border p-3 rounded">
              <div className="flex items-start gap-3">
                {ub.book.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ub.book.cover_url} alt={ub.book.title} className="w-12 h-16 object-cover rounded" />
                )}
                <div className="flex-1">
                  <div className="font-semibold">{ub.book.title}</div>
                  <div className="text-sm text-gray-600">
                    {ub.book.author?.full_name ? ub.book.author.full_name : 'Unknown author'}
                    {ub.book.category?.title ? ` · ${ub.book.category.title}` : ''}
                  </div>
                  {ub.description && (
                    <p className="text-sm mt-2">{ub.description}</p>
                  )}
                  <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-3">
                    {ub.status && <span>Status: {ub.status}</span>}
                    {ub.rating != null && <span>Rating: {ub.rating}</span>}
                    {ub.started_at && <span>Started: {new Date(ub.started_at).toLocaleDateString()}</span>}
                    {ub.finished_at && <span>Finished: {new Date(ub.finished_at).toLocaleDateString()}</span>}
                    {ub.book.pages != null && <span>Pages: {ub.book.pages}</span>}
                    {ub.book.publish_date && <span>Published: {new Date(ub.book.publish_date).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}