import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full p-24 flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold">
          Welcome to Bookie!
        </h1>
        <h2 className="text-2xl font-bold">Manage your books and reading progress!</h2>
      </div>
    </main>
  )
}