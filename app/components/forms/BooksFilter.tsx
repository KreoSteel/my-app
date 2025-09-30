import { useEffect, useState } from "react";
import type { BookFilters } from "@/app/types/BookFilters";
import { Input } from "@/components/ui/input";

export default function BooksFilter({ value, onChange }: { value: BookFilters, onChange: (v: BookFilters) => void}) {
    const [local, setLocal] = useState<BookFilters>(value);

    useEffect(() => {
        const id = setTimeout(() => onChange(local), 600)
        return () => clearTimeout(id)
    }, [local, onChange])
    return (
        <div className="grid grid-cols-2 gap-3">
            <span>
            <label htmlFor="query">Search</label>
            <Input 
                id="query" 
                type="text" 
                value={local.query ?? ''} 
                onChange={(e) => setLocal({
                    ...local, 
                    query: e.target.value === '' ? '' : e.target.value
                })}
            />
            </span>
            <span>
            <label htmlFor="minRating">Min Rating</label>
            <Input 
                id="minRating" 
                type="number" 
                value={local.minRating ?? ''} 
                onChange={(e) => setLocal({
                    ...local, 
                    minRating: e.target.value === '' ? undefined : Number(e.target.value)
                })}
            />
            </span>
            <span>
            <label htmlFor="minPages">Min Pages</label>
                <Input 
                id="minPages" 
                type="number" 
                value={local.minPages ?? ''} 
                onChange={(e) => setLocal({
                    ...local, 
                    minPages: e.target.value === '' ? undefined : Number(e.target.value)
                })}
            />
            </span>
            <span>
            <label htmlFor="maxPages">Max Pages</label>
            <Input 
                id="maxPages" 
                type="number" 
                value={local.maxPages ?? ''} 
                onChange={(e) => setLocal({
                    ...local, 
                    maxPages: e.target.value === '' ? undefined : Number(e.target.value)
                })}
            />
            </span>
        </div>
    )
}