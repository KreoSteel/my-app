"use client"
import Link from "next/link";
import { Button } from "@/app/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { UserCog } from "lucide-react"
export default function Header() {
    const { setTheme, theme } = useTheme()
    return (
        <header className="bg-header-bg p-6 fixed top-0 left-0 w-full z-50 shadow-header-purple">
            <ul className="flex gap-10 items-center justify-center text-header-foreground text-xl font-bold">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/my-list">My List</Link></li>
                <li><Link href="/list">Browse Books</Link></li>
                <li><Link href="/authors">Authors</Link></li>
                <li><Link href="/friends">Friends</Link></li>
                <li><Link href="/rating">Rating</Link></li>
            </ul>
            <div className="absolute left-5 top-5">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline"><UserCog /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="start">
                        <Link href="/profile">
                            <DropdownMenuItem>My Account</DropdownMenuItem>
                        </Link>
                        <Link href="/my-list">
                            <DropdownMenuItem>My Reading List</DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setTheme(`${theme === "light" ? "dark" : "light"}`)}>{theme === "light" ? "Dark Theme" : "Light Theme"}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => console.log("logout")}>
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}