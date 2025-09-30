import type { Author } from "@/app/types/Author"

export default function AuthorCards({ item: author }: { item: Partial<Author> }) {
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <div className="group p-6 flex flex-col gap-4 bg-foreground rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-border/20">
            {/* Header with author name */}
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl text-background font-bold group-hover:text-primary transition-colors duration-200">
                    {author.full_name || 'Unknown Author'}
                </h2>
                <div className="w-12 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
            </div>

            {/* Description */}
            {author.description && (
                <p className="text-sm text-background/80 leading-relaxed line-clamp-3">
                    {author.description}
                </p>
            )}

            {/* Birth date with icon */}
            <div className="flex items-center gap-2 mt-auto">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-sm text-background/70 font-medium">
                    Born: {formatDate(author.birth_date)}
                </span>
            </div>

            {/* Hover effect indicator */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-xs text-background/50 text-right">
                    Click to view details →
                </div>
            </div>
        </div>
    )
}