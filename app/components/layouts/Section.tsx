export default function Section({ children }: { children: React.ReactNode }) {
    return (
        <section className="p-6 min-h-[600px] w-[1000px] bg-border rounded-md shadow-double">
            {children}
        </section>
    )
}