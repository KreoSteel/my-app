"use client"
import { Button } from "@/app/components/ui/button";
import { loginUser } from "@/app/services/auth";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useForm, SubmitHandler } from "react-hook-form";
import { redirect } from "next/navigation";

export default function Login() {
    type Inputs = {
        email: string
        password: string
    }

        const {
            register,
            handleSubmit,
            formState: { errors },
        } = useForm<Inputs>()
        const onSubmit: SubmitHandler<Inputs> = async (data) => {
            await loginUser(data.email, data.password)
            redirect("/")
        }

    return (
        <main className="flex min-h-screen flex-col items-center relative">
            <div className="flex flex-col items-center absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-gray-200 rounded-md p-10 shadow-double">
                <h1 className="text-4xl font-bold">Login</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-10 items-center">
                    <div className="flex flex-col gap-2 w-96">
                        <label htmlFor="email">Email</label>
                        <Input type="email" id="email" placeholder="Email" className="placeholder:text-gray-400" {...register("email", { required: "Email is required" })} />
                        {errors.email && <span className="text-sm text-red-500">{errors.email.message}</span>}
                    </div>
                    <div className="flex flex-col gap-2 w-96">
                        <label htmlFor="password">Password</label>
                        <Input type="password" id="password" placeholder="Password" className="placeholder:text-gray-400" {...register("password", { required: "Password is required" })} />
                        {errors.password && <span className="text-sm text-red-500">{errors.password.message}</span>}
                    </div>
                    <Button type="submit" className="w-30 flex bg-primary text-gray-200 rounded-sm hover:bg-primary/90 hover:scale-105 cursor-pointer active:scale-95 active:shadow-2xl transition-all duration-300">Login</Button>
                    <p className="text-sm text-gray-500">Do you have an account? <Link href="/auth/login" className="text-primary hover:underline">Login</Link></p>
                </form>
            </div>
        </main>
    )
}