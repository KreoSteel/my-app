import React from "react"

interface ReusableListProps<T extends object> {
    items: T[]
    error: unknown
    isLoading: boolean
    CardComponent: React.ComponentType<{ item: T }>
    getItemKey: (item: T) => React.Key
    layout?: 'list' | 'grid'
    gridCols?: '1' | '2' | '3' | '4' | '5' | '6'
}

export default function ReusableList<T extends object>({ 
    items, 
    error, 
    isLoading, 
    CardComponent, 
    getItemKey,
    layout = 'list',
    gridCols = '3'
}: ReusableListProps<T>) {
    const renderItem = (item: T) => (
        <div key={getItemKey(item)}>
            <CardComponent item={{...item}} />
        </div>
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-foreground/60">Loading...</p>
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
                        <h3 className="text-lg font-semibold text-foreground">No items found</h3>
                        <p className="text-foreground/60">
                            {layout === 'grid' ? 'No books available at the moment.' : 'No items to display.'}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    const containerClass = layout === 'grid' 
        ? `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${gridCols} gap-6`
        : 'flex flex-col gap-4'

    return (
        <div className={containerClass}>
            {items.map(renderItem)}
        </div>
    )
}