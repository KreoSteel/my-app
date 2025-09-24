"use client"
import { Button } from "@/app/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm, SubmitHandler } from "react-hook-form";
import Link from "next/link";
import { registerUser } from "@/app/services/auth";


export default function Register() {
    type Inputs = {
        fullName: string
        email: string
        password: string
    }

        const {
            register,
            handleSubmit,
            watch,
            formState: { errors },
        } = useForm<Inputs>()
        const onSubmit: SubmitHandler<Inputs> = (data) => registerUser(data.fullName, data.email, data.password)

        return (
            <main className="flex min-h-screen flex-col items-center relative">
                <div className="flex flex-col items-center absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-gray-200 rounded-md p-10 shadow-double">
                    <h1 className="text-4xl font-bold">Register</h1>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-10 items-center">
                        <div className="flex flex-col gap-2 w-96">
                            <label htmlFor="fullName">Full Name</label>
                            <Input type="text" id="fullName" placeholder="Full Name" className="placeholder:text-gray-400" {...register("fullName")} />
                        </div>
                        <div className="flex flex-col gap-2 w-96">
                            <label htmlFor="email">Email</label>
                            <Input type="email" id="email" placeholder="Email" className="placeholder:text-gray-400" {...register("email")} />
                        </div>
                        <div className="flex flex-col gap-2 w-96">
                            <label htmlFor="password">Password</label>
                            <Input type="password" placeholder="Password" className="placeholder:text-gray-400" {...register("password")} />
                        </div>
                        <Button type="submit" className="w-30 flex bg-primary text-gray-200 rounded-sm hover:bg-primary/90 hover:scale-105 cursor-pointer active:scale-95 active:shadow-2xl transition-all duration-300">Register</Button>
                        <p className="text-sm text-gray-500">Already have an account? <Link href="/auth/register" className="text-primary hover:underline">Login</Link></p>
                    </form>
                </div>
            </main>
        )
    }