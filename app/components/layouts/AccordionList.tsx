import React, { useState } from "react"

interface AccordionListProps<T extends object> {
    items: T[]
    error: unknown
    isLoading: boolean
    ListItemComponent: React.ComponentType<{ 
        item: T
        isOpen: boolean
        onToggle: () => void
    }>
    getItemKey: (item: T) => React.Key
}

export default function AccordionList<T extends object>({ 
    items, 
    error, 
    isLoading, 
    ListItemComponent, 
    getItemKey 
}: AccordionListProps<T>) {
    const [openItems, setOpenItems] = useState<Set<React.Key>>(new Set())

    const toggleItem = (key: React.Key) => {
        setOpenItems(prev => {
            const newSet = new Set(prev)
            if (newSet.has(key)) {
                newSet.delete(key)
            } else {
                newSet.add(key)
            }
            return newSet
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-foreground/60">Loading books...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                    <div className="text-red-500 text-6xl">⚠️</div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">Something went wrong</h3>
                        <p className="text-foreground/60">
                            {error instanceof Error ? error.message : String(error)}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (!Array.isArray(items) || items.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                    <div className="text-foreground/40 text-6xl">📚</div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">No books found</h3>
                        <p className="text-foreground/60">
                            No books are available at the moment.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {items.map(item => (
                <ListItemComponent
                    key={getItemKey(item)}
                    item={item}
                    isOpen={openItems.has(getItemKey(item))}
                    onToggle={() => toggleItem(getItemKey(item))}
                />
            ))}
        </div>
    )
}
