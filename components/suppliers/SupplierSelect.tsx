"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Factory, Loader2, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useSupplierStore } from "@/stores/supplier-store";
import { formatPrice } from "@/lib/format";
import { useLocale } from "next-intl";

interface SupplierSelectProps {
    value?: number | null;
    onChange: (value: number | null) => void;
    onAddNew?: () => void;
}

export function SupplierSelect({ value, onChange, onAddNew }: SupplierSelectProps) {
    const [open, setOpen] = React.useState(false);
    const { suppliers, fetchSuppliers, isLoading } = useSupplierStore();
    const locale = useLocale();

    React.useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const selectedSupplier = suppliers.find((s) => s.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-10"
                >
                    {selectedSupplier ? (
                        <div className="flex items-center gap-2 text-left overflow-hidden">
                            <span className="truncate font-medium">{selectedSupplier.name}</span>
                            {selectedSupplier.currentBalance > 0 && (
                                <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full shrink-0">
                                    Due: {formatPrice(selectedSupplier.currentBalance, locale)}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Factory className="h-4 w-4" /> Select Supplier...
                        </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search supplier..." />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2 space-y-2 text-center text-sm text-muted-foreground">
                                No supplier found.
                                {onAddNew && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-2"
                                        onClick={() => {
                                            onAddNew();
                                            setOpen(false);
                                        }}
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> Add New Supplier
                                    </Button>
                                )}
                            </div>
                        </CommandEmpty>
                        <CommandGroup>
                            {isLoading && (
                                <div className="p-2 flex items-center justify-center text-slate-500">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
                                </div>
                            )}
                            {suppliers.map((supplier) => (
                                <CommandItem
                                    key={supplier.id}
                                    value={`${supplier.name} ${supplier.phone}`}
                                    onSelect={() => {
                                        onChange(supplier.id === value ? null : supplier.id!);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === supplier.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="font-medium truncate">{supplier.name}</span>
                                        <span className="text-xs text-muted-foreground">{supplier.phone}</span>
                                    </div>
                                    {supplier.currentBalance > 0 && (
                                        <div className="ml-2 text-right">
                                            <span className="text-xs font-bold text-red-600">
                                                {formatPrice(supplier.currentBalance, locale)}
                                            </span>
                                        </div>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
