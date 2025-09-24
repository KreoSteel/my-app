import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full p-24 flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold">
          Welcome to Bookie!
        </h1>
        <h2 className="text-2xl font-bold">Manage your books and reading progress!</h2>
        <span className="flex flex-col items-center gap-2">
          <p>Login to get started</p>
          <Link href="/auth/login" className="text-primary hover:underline">Login</Link>
          <p>or</p>
          <Link href="/auth/register" className="text-primary hover:underline">Register</Link>
        </span>
      </div>
    </main>
  )
}