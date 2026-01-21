"use client";

import * as React from "react";
import { Check, ChevronsUpDown, User, Loader2, Plus } from "lucide-react";

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
import { useCustomerStore } from "@/stores/customer-store";
import { formatPrice } from "@/lib/format";
import { useLocale } from "next-intl";

interface CustomerSelectProps {
    value?: number | null;
    onChange: (value: number | null) => void;
    onAddNew?: () => void;
}

export function CustomerSelect({ value, onChange, onAddNew }: CustomerSelectProps) {
    const [open, setOpen] = React.useState(false);
    const { customers, fetchCustomers, isLoading } = useCustomerStore();
    const locale = useLocale();

    React.useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const selectedCustomer = customers.find((c) => c.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-10"
                >
                    {selectedCustomer ? (
                        <div className="flex items-center gap-2 text-left overflow-hidden">
                            <span className="truncate font-medium">{selectedCustomer.name}</span>
                            <span className={cn(
                                "text-xs px-1.5 py-0.5 rounded-full shrink-0",
                                selectedCustomer.currentBalance > 0 ? "bg-red-100 text-red-700" :
                                    selectedCustomer.currentBalance < 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                            )}>
                                {formatPrice(Math.abs(selectedCustomer.currentBalance), locale)}
                            </span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" /> Select Customer...
                        </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search name/phone..." />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2 space-y-2 text-center text-sm text-muted-foreground">
                                No customer found.
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
                                        <Plus className="h-3 w-3 mr-1" /> Add New Customer
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
                            {customers.map((customer) => (
                                <CommandItem
                                    key={customer.id}
                                    value={`${customer.name} ${customer.phone}`} // Searchable string
                                    onSelect={() => {
                                        onChange(customer.id === value ? null : customer.id!);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === customer.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="font-medium truncate">{customer.name}</span>
                                        <span className="text-xs text-muted-foreground">{customer.phone}</span>
                                    </div>
                                    <div className="ml-2 text-right">
                                        <span className={cn(
                                            "text-xs font-bold whitespace-nowrap",
                                            customer.currentBalance > 0 ? "text-red-600" :
                                                customer.currentBalance < 0 ? "text-green-600" : "text-slate-500"
                                        )}>
                                            {formatPrice(Math.abs(customer.currentBalance), locale)}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
