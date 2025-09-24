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
import { redirect } from "next/navigation"


export default function AuthorsPage() {
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
        
        const onSubmit: SubmitHandler<Inputs> = async (data) => {
            // Format date to dd-mm-yyyy
            const formatDate = (date: Date) => {
                const day = date.getDate().toString().padStart(2, '0')
                const month = (date.getMonth() + 1).toString().padStart(2, '0')
                const year = date.getFullYear()
                return `${day}-${month}-${year}`
            }

            const formattedData = {
                ...data,
                date_of_birth: data.date_of_birth 
                    ? formatDate(data.date_of_birth)
                    : undefined
            }
            console.log("Form data:", formattedData)
            // await createAuthor(formattedData.full_name, formattedData.description, formattedData.date_of_birth)
            // redirect("/")
        }
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(
        new Date(2025, 5, 12)
    )

    return (
        <Section>
            <h1>Authors</h1>
            <p>List of authors will be displayed here</p>
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-2xl font-bold">Create Author</AccordionTrigger>
                    <AccordionContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
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
                            <Button className="w-fit" type="submit">Create</Button>
                        </form>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Section>
    )
}