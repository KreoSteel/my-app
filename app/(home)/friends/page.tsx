"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createFriendInvitation, InvitationCreateResponse, listIncomingInvitations, acceptInvitationById, listFriends, type FriendListItem } from '@/app/services/friends';

export default function Friends() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<InvitationCreateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await createFriendInvitation(email);
      setResult(data);
      await loadInvites();
    } catch (err: any) {
      setError(err?.apiMessage || err?.message || 'Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  const loadInvites = async () => {
    setLoadingInvites(true);
    try {
      const resp = await listIncomingInvitations();
      setInvites(resp.invites);
    } catch (e) {
      // ignore for now
    } finally {
      setLoadingInvites(false);
    }
  };

  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const resp = await listFriends();
      setFriends(resp.friends);
    } catch (e) {
      // ignore for now
    } finally {
      setLoadingFriends(false);
    }
  };

  useEffect(() => {
    loadInvites();
    loadFriends();
  }, []);

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Friends</h1>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Friend's email"
          className="flex-1 border p-2 rounded"
        />
        <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
          {loading ? 'Sending…' : 'Send invite'}
        </button>
      </form>

      {error && <p className="text-red-600 mt-3" role="alert">{error}</p>}
      {result && (
        <div className="mt-4 p-3 border rounded bg-green-50">
          <p className="font-medium">Invitation created</p>
          <p className="text-sm">ID: {result.id}</p>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-semibold">Incoming invites</h2>
          {!loadingInvites && (
            <span className="text-sm text-muted-foreground">{invites.length}</span>
          )}
        </div>
        {loadingInvites ? (
          <div className="animate-pulse text-sm text-muted-foreground">Loading invites…</div>
        ) : invites.length === 0 ? (
          <div className="text-gray-500">No incoming invites</div>
        ) : (
          <ul className="space-y-3">
            {invites.map((inv) => {
              const canAccept = !inv.expired && !inv.accepted_at;
              return (
                <li key={inv.id} className="border p-3 rounded flex items-center justify-between">
                  <div>
                    <div className="font-medium">{inv.inviter_name} ({inv.inviter_email})</div>
                    {inv.expired && <div className="text-sm text-yellow-700">Expired</div>}
                    {inv.accepted_at && <div className="text-sm text-green-700">Accepted on {inv.accepted_at}</div>}
                  </div>
                  {canAccept && (
                    <button
                      onClick={async () => {
                        setAcceptingId(inv.id);
                        try {
                          await acceptInvitationById(inv.id);
                          await loadInvites();
                          await loadFriends();
                        } finally {
                          setAcceptingId(null);
                        }
                      }}
                      disabled={acceptingId === inv.id}
                      className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                      {acceptingId === inv.id ? 'Accepting…' : 'Accept'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-3">Your friends</h2>
        {loadingFriends ? (
          <div className="space-y-3">
            <div className="h-12 bg-muted/40 rounded animate-pulse" />
            <div className="h-12 bg-muted/40 rounded animate-pulse" />
            <div className="h-12 bg-muted/40 rounded animate-pulse" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-gray-500">No friends yet</div>
        ) : (
          <ul className="space-y-3">
            {friends.map((f) => (
              <li key={f.id} className="border p-3 rounded">
                <Link href={`/friends/${f.id}`} className="flex items-center gap-3">
                  {f.avatar_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.avatar_url} alt={f.full_name} className="w-8 h-8 rounded-full" />
                  )}
                  <span className="font-medium hover:underline">{f.full_name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}