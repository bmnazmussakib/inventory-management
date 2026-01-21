import { useState, useEffect } from 'react';
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
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { type Customer } from '@/lib/db';

const customerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(1, 'Phone is required'),
    address: z.string().optional(),
    notes: z.string().optional(),
    currentBalance: z.number(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface AddCustomerDialogProps {
    customerToEdit?: Customer | null;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function AddCustomerDialog({ customerToEdit, open: controlledOpen, onOpenChange: setControlledOpen, trigger }: AddCustomerDialogProps) {
    const [open, setOpen] = useState(false);
    const { addCustomer, updateCustomer } = useCustomerStore();

    // Controlled vs Uncontrolled logic
    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : open;
    const onOpenChange = isControlled ? setControlledOpen : setOpen;

    const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: '',
            phone: '',
            address: '',
            notes: '',
            currentBalance: 0
        }
    });

    useEffect(() => {
        if (customerToEdit) {
            reset({
                name: customerToEdit.name,
                phone: customerToEdit.phone,
                address: customerToEdit.address || '',
                notes: customerToEdit.notes || '',
                currentBalance: customerToEdit.currentBalance || 0
            });
        } else {
            reset({
                name: '',
                phone: '',
                address: '',
                notes: '',
                currentBalance: 0
            });
        }
    }, [customerToEdit, isOpen, reset]);

    const onSubmit = async (data: CustomerFormValues) => {
        try {
            if (customerToEdit && customerToEdit.id) {
                await updateCustomer(customerToEdit.id, data);
                toast.success('Customer updated successfully');
            } else {
                await addCustomer(data as Customer);
                toast.success('Customer added successfully');
            }
            onOpenChange?.(false);
            if (!customerToEdit) reset();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save customer');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            {!trigger && !isControlled && (
                <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" /> Add Customer
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{customerToEdit ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input id="name" {...register('name')} placeholder="Customer Name" />
                        {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input id="phone" {...register('phone')} placeholder="Phone Number" />
                        {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea id="address" {...register('address')} placeholder="Address (Optional)" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" {...register('notes')} placeholder="Notes (Optional)" />
                    </div>

                    {/* Hidden balance field for new customers, could be visible if we allowed opening balance setting */}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
