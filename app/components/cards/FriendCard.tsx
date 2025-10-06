"use client";
import Link from "next/link";
import type { FriendListItem } from "@/app/services/friends";

export default function FriendCard({ item }: { item: FriendListItem }) {
    return (
        <Link href={`/friends/${item.id}`} className="flex items-center gap-3 p-3 border rounded hover:bg-accent/40 transition-colors">
            {item.avatar_url && (
                <img src={item.avatar_url} alt={item.full_name} className="w-10 h-10 rounded-full object-cover" />
            )}
            <div className="flex-1">
                <div className="font-semibold">{item.full_name}</div>
            </div>
        </Link>
    );
}



