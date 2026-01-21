import { useState } from 'react';
import { useCustomerStore } from '@/stores/customer-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { type Customer, type Payment } from '@/lib/db';

const paymentSchema = z.object({
    amount: z.number().min(1, 'Amount must be greater than 0'),
    type: z.enum(['received', 'given']),
    date: z.string(),
    notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentDialogProps {
    customer: Customer;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function PaymentDialog({ customer, open: controlledOpen, onOpenChange: setControlledOpen, trigger }: PaymentDialogProps) {
    const [open, setOpen] = useState(false);
    const { addPayment } = useCustomerStore();

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : open;
    const onOpenChange = isControlled ? setControlledOpen : setOpen;

    const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: 0,
            type: 'received',
            date: new Date().toISOString().split('T')[0],
            notes: ''
        }
    });

    const onSubmit = async (data: PaymentFormValues) => {
        try {
            if (!customer.id) {
                toast.error('Customer ID missing');
                return;
            }

            const paymentData: Payment = {
                customerId: customer.id,
                amount: data.amount,
                date: data.date,
                type: data.type,
                notes: data.notes
            };

            await addPayment(paymentData);
            toast.success('Payment recorded successfully');

            onOpenChange?.(false);
            reset({
                amount: 0,
                type: 'received',
                date: new Date().toISOString().split('T')[0],
                notes: ''
            });

        } catch (error) {
            console.error(error);
            toast.error('Failed to record payment');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            {!trigger && !isControlled && (
                <DialogTrigger asChild>
                    <Button variant="outline" className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100">
                        <DollarSign className="h-4 w-4 mr-2" /> Receive Payment
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Record Payment: {customer.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label>Transaction Type</Label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <input type="radio" id="received" value="received" className="hidden peer" {...register('type')} defaultChecked />
                                <label htmlFor="received" className="block text-center px-4 py-2 rounded-lg border border-slate-200 peer-checked:bg-green-600 peer-checked:text-white peer-checked:border-green-600 cursor-pointer text-sm font-bold">
                                    Receive Money (জমা)
                                </label>
                            </div>
                            <div className="flex-1">
                                <input type="radio" id="given" value="given" className="hidden peer" {...register('type')} />
                                <label htmlFor="given" className="block text-center px-4 py-2 rounded-lg border border-slate-200 peer-checked:bg-red-500 peer-checked:text-white peer-checked:border-red-500 cursor-pointer text-sm font-bold">
                                    Return Money (ফেরত)
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="date">Date</Label>
                        <Input type="date" id="date" {...register('date')} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input type="number" id="amount" {...register('amount', { valueAsNumber: true })} placeholder="0.00" className="text-lg font-bold" />
                        {errors.amount && <span className="text-red-500 text-xs">{errors.amount.message}</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" {...register('notes')} placeholder="Reference / method / notes" />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
                        <Button type="submit">Save Record</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
