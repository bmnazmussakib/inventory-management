import { useState, useEffect } from 'react';
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
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { type Supplier } from '@/lib/db';

const supplierSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(1, 'Phone is required'),
    address: z.string().optional(),
    notes: z.string().optional(),
    currentBalance: z.number(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface AddSupplierDialogProps {
    supplierToEdit?: Supplier | null;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function AddSupplierDialog({ supplierToEdit, open: controlledOpen, onOpenChange: setControlledOpen, trigger }: AddSupplierDialogProps) {
    const [open, setOpen] = useState(false);
    const { addSupplier, updateSupplier } = useSupplierStore();

    // Controlled vs Uncontrolled logic
    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : open;
    const onOpenChange = isControlled ? setControlledOpen : setOpen;

    const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            name: '',
            phone: '',
            address: '',
            notes: '',
            currentBalance: 0
        }
    });

    useEffect(() => {
        if (supplierToEdit) {
            reset({
                name: supplierToEdit.name,
                phone: supplierToEdit.phone,
                address: supplierToEdit.address || '',
                notes: supplierToEdit.notes || '',
                currentBalance: supplierToEdit.currentBalance || 0
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
    }, [supplierToEdit, isOpen, reset]);

    const onSubmit = async (data: SupplierFormValues) => {
        try {
            if (supplierToEdit && supplierToEdit.id) {
                await updateSupplier(supplierToEdit.id, data);
                toast.success('Supplier updated successfully');
            } else {
                await addSupplier(data as Supplier);
                toast.success('Supplier added successfully');
            }
            onOpenChange?.(false);
            if (!supplierToEdit) reset();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save supplier');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            {!trigger && !isControlled && (
                <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" /> Add Supplier
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{supplierToEdit ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input id="name" {...register('name')} placeholder="Supplier Name" />
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

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
