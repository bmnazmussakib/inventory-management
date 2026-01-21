"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useExpenseStore } from "@/stores/expense-store";
import { Expense } from "@/lib/db";

const formSchema = z.object({
    date: z.date(),
    category: z.string().min(1, "Category is required"),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    description: z.string().optional(),
    paymentMethod: z.enum(["cash", "card", "mobile", "bank_transfer"]),
});

type FormValues = z.infer<typeof formSchema>;

interface AddExpenseDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    expenseToEdit?: Expense | null;
    children?: React.ReactNode;
}

export function AddExpenseDialog({
    open,
    onOpenChange,
    expenseToEdit,
    children,
}: AddExpenseDialogProps) {
    const t = useTranslations("Expenses"); // Assuming you'll add translations later
    const { addExpense, updateExpense } = useExpenseStore();
    const [dialogOpen, setDialogOpen] = useState(open || false);

    // Sync internal state with prop if controlled
    useEffect(() => {
        if (open !== undefined) {
            setDialogOpen(open);
        }
    }, [open]);

    const handleOpenChange = (newOpen: boolean) => {
        setDialogOpen(newOpen);
        onOpenChange?.(newOpen);
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: new Date(),
            category: "",
            amount: 0,
            description: "",
            paymentMethod: "cash",
        },
    });

    useEffect(() => {
        if (expenseToEdit) {
            form.reset({
                date: new Date(expenseToEdit.date),
                category: expenseToEdit.category,
                amount: expenseToEdit.amount,
                description: expenseToEdit.description || "",
                paymentMethod: expenseToEdit.paymentMethod,
            });
        } else {
            form.reset({
                date: new Date(),
                category: "",
                amount: 0,
                description: "",
                paymentMethod: "cash",
            });
        }
    }, [expenseToEdit, form]);

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        try {
            const expenseData: Omit<Expense, 'id'> = {
                date: values.date.toISOString(),
                category: values.category,
                amount: values.amount,
                description: values.description,
                paymentMethod: values.paymentMethod,
            };

            if (expenseToEdit?.id) {
                await updateExpense(expenseToEdit.id, expenseData);
            } else {
                await addExpense(expenseData);
            }
            handleOpenChange(false);
            if (!expenseToEdit) {
                form.reset();
            }
        } catch (error) {
            console.error("Failed to save expense:", error);
        }
    };

    const categories = [
        "Rent",
        "Utilities",
        "Salaries",
        "Inventory",
        "Marketing",
        "Maintenance",
        "Office Supplies",
        "Other",
    ];

    return (
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {expenseToEdit ? "Edit Expense" : "Add Expense"}
                    </DialogTitle>
                    <DialogDescription>
                        {expenseToEdit
                            ? "Update the details of the expense."
                            : "Add a new expense record."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat} value={cat}>
                                                        {cat}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payment Method</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="card">Card</SelectItem>
                                            <SelectItem value="mobile">Mobile Banking</SelectItem>
                                            <SelectItem value="bank_transfer">
                                                Bank Transfer
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Optional details..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">
                                {expenseToEdit ? "Save Changes" : "Add Expense"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
