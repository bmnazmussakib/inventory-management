import { useState } from 'react';
import { useSupplierStore } from '@/stores/supplier-store';
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
import { toast } from 'sonner';
import { type Supplier } from '@/lib/db';
import { formatPrice } from '@/lib/format';
import { useLocale } from 'next-intl';

interface SupplierPaymentDialogProps {
    supplier: Supplier;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function SupplierPaymentDialog({ supplier, trigger, open: controlledOpen, onOpenChange: setControlledOpen }: SupplierPaymentDialogProps) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState<string>('');
    const [notes, setNotes] = useState('');
    const { addPayment } = useSupplierStore();
    const locale = useLocale();

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : open;
    const onOpenChange = isControlled ? setControlledOpen : setOpen;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) {
            toast.error('Enter valid amount');
            return;
        }

        try {
            await addPayment({
                supplierId: supplier.id!,
                amount: Number(amount),
                date: new Date().toISOString(),
                type: 'paid',
                notes
            });
            toast.success('Payment recorded successfully');
            setAmount('');
            setNotes('');
            onOpenChange?.(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to record payment');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Pay to {supplier.name} (পেমেন্ট দিন)</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                        <p className="text-xs text-red-600 dark:text-red-400">Current Due (বর্তমান বকেয়া)</p>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-400">{formatPrice(supplier.currentBalance, locale)}</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="amount">Amount *</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Check No, Transaction ID, etc."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
                        <Button type="submit">Confirm Payment</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
