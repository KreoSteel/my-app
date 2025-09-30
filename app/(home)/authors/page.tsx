"use client"
import Section from "@/app/components/layouts/Section"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDownIcon } from "lucide-react"
import { SubmitHandler, useForm } from "react-hook-form"
import { createAuthor, useAuthors } from "@/app/services/authors"
import AuthorCards from "@/app/components/cards/AuthorCard"
import ReusableList from "@/app/components/layouts/ReusableList"
import { useQueryClient } from "@tanstack/react-query"


export default function AuthorsPage() {
    const { data: authors, isLoading: authorsLoading, error: authorsError, refetch: refetchAuthors } = useAuthors()
    const queryClient = useQueryClient()
    type Inputs = {
        full_name: string
        description: string
        date_of_birth: Date | undefined
    }

        const {
            register,
            handleSubmit,
            setValue,
            formState: { errors },
        } = useForm<Inputs>({
            defaultValues: {
                full_name: "",
                description: "",
                date_of_birth: undefined,
            }
        })
        
        const [isLoading, setIsLoading] = React.useState(false)
        const [error, setError] = React.useState<string | null>(null)
        const [success, setSuccess] = React.useState<string | null>(null)

        const onSubmit: SubmitHandler<Inputs> = async (data) => {
            const formatDate = (date: Date) => {
                const day = date.getDate().toString().padStart(2, '0')
                const month = (date.getMonth() + 1).toString().padStart(2, '0')
                const year = date.getFullYear()
                return `${day}-${month}-${year}`
            }

            const formattedData = {
                full_name: data.full_name,
                description: data.description,
                birth_date: data.date_of_birth
                    ? formatDate(data.date_of_birth)
                    : undefined
            }
            
            setIsLoading(true)
            setError(null)
            setSuccess(null)
            
            try {
                
                console.log("Form data:", formattedData)
                await createAuthor(formattedData)
                console.log('Author created successfully')
                setSuccess('Author created successfully!')
                // Reset form
                setValue('full_name', '')
                setValue('description', '')
                setValue('date_of_birth', undefined)
            } catch (err: any) {
                console.error('Error creating author:', err)
                setError(err.message || 'Failed to create author. Please try again.')
            } finally {
                queryClient.invalidateQueries({ queryKey: ['authors'] })
                setIsLoading(false)
            }
        }
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(
        new Date(2025, 5, 12)
    )

    return (
        <Section>
            <h1>Authors</h1>
            <p>List of authors will be displayed here</p>
            <Button onClick={() => refetchAuthors()}>{authorsLoading ? 'Loading...' : 'Refresh'}</Button>
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-2xl font-bold">Create Author</AccordionTrigger>
                    <AccordionContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
                            {error && (
                                <div className="w-1/3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="w-1/3 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                                    {success}
                                </div>
                            )}
                            <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium placeholder:text-gray-500">Author's Name</label>
                            <Input type="text" className="w-1/3" required {...register("full_name")}/>
                            <label className="text-sm font-medium placeholder:text-gray-500">Author's Biography</label>
                            <Textarea className="w-1/3" rows={4} required {...register("description")}/>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="date" className="text-sm font-medium placeholder:text-gray-500">
                                    Date of birth
                                </label>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                        variant="outline"
                                            id="date"
                                            className="w-48 justify-between font-normal"
                                        >
                                            {date ? date?.toLocaleDateString() : "Select date"}
                                            <ChevronDownIcon />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            captionLayout="dropdown"
                                            onSelect={(selectedDate) => {
                                                setDate(selectedDate)
                                                setValue("date_of_birth", selectedDate)
                                                setOpen(false)
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <Button 
                                className="w-fit" 
                                type="submit" 
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating...' : 'Create'}
                            </Button>
                        </form>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <ReusableList items={authors || []} error={authorsError} isLoading={authorsLoading} CardComponent={AuthorCards} getItemKey={(item) => item.id} />
        </Section>
    )
}