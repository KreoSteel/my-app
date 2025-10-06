"use client";
import { useEffect, useState } from "react";
import { listFriends, type FriendListItem } from "@/app/services/friends";

export function useFriends() {
    const [data, setData] = useState<FriendListItem[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const resp = await listFriends();
                setData(resp.friends);
            } catch (e) {
                setError(e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    return { data, isLoading, error };
}



