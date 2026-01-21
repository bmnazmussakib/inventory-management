'use client';

import { useState, useEffect } from 'react';
import { useSupplierStore } from '@/stores/supplier-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, FileText, Pencil, Trash2, Phone, Factory } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useLocale } from 'next-intl';
import { AddSupplierDialog } from '@/components/suppliers/AddSupplierDialog';
import { type Supplier } from '@/lib/db';
import Link from 'next/link';

export default function SuppliersPage() {
    const { suppliers, fetchSuppliers, deleteSupplier } = useSupplierStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const locale = useLocale();

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm)
    );

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this supplier?')) {
            await deleteSupplier(id);
        }
    };

    const totalPayable = suppliers.reduce((sum, s) => sum + Math.max(0, s.currentBalance), 0);

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Suppliers (সাপ্লায়ার)</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage suppliers and track your payables</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-500">Total Payable</p>
                        <p className="text-lg font-bold text-red-600">{formatPrice(totalPayable, locale)}</p>
                    </div>
                    <Button onClick={() => { setEditingSupplier(null); setIsAddDialogOpen(true); }} className="bg-primary hover:bg-primary/90">
                        Add Supplier
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <TableRow>
                                <TableHead className="font-bold">Name</TableHead>
                                <TableHead className="font-bold">Phone</TableHead>
                                <TableHead className="font-bold text-right">Balance (Payable)</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSuppliers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Factory className="h-10 w-10 mb-2 opacity-20" />
                                            <p>No suppliers found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSuppliers.map((supplier) => (
                                    <TableRow key={supplier.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <TableCell className="font-medium">
                                            <Link href={`/suppliers/${supplier.id}`} className="hover:underline hover:text-primary flex items-center gap-2">
                                                {supplier.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Phone className="h-3 w-3" /> {supplier.phone}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className={`font-bold px-2 py-1 rounded-full text-xs ${supplier.currentBalance > 0
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                }`}>
                                                {formatPrice(supplier.currentBalance, locale)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/suppliers/${supplier.id}`}>
                                                            <FileText className="mr-2 h-4 w-4" /> View Ledger
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => { setEditingSupplier(supplier); setIsAddDialogOpen(true); }}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => supplier.id && handleDelete(supplier.id)} className="text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <AddSupplierDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                supplierToEdit={editingSupplier}
            />
        </div>
    );
}
