import * as React from "react"
import { Check, ChevronsUpDown, User, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useCustomerStore } from "@/stores/customer-store"
import { AddCustomerDialog } from "./add-customer-dialog"

interface CustomerSelectProps {
    value?: string;
    onChange: (value: string) => void;
}

export function CustomerSelect({ value, onChange }: CustomerSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const { customers, fetchCustomers } = useCustomerStore()

    React.useEffect(() => {
        fetchCustomers()
    }, [fetchCustomers])

    const selectedCustomer = customers.find((customer) => customer.id?.toString() === value)

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {selectedCustomer ? (
                            <div className="flex flex-col items-start gap-0.5 text-left">
                                <span className="font-bold">{selectedCustomer.name}</span>
                                <span className="text-xs text-muted-foreground">{selectedCustomer.phone}</span>
                            </div>
                        ) : (
                            "Select customer..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder="Search customer..." />
                        <CommandList>
                            <CommandEmpty className="p-2">
                                <p className="text-sm text-center text-muted-foreground mb-2">No customer found.</p>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                        setOpen(false);
                                        setIsAddDialogOpen(true);
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add New Customer
                                </Button>
                            </CommandEmpty>
                            <CommandGroup>
                                {customers.map((customer) => (
                                    <CommandItem
                                        key={customer.id}
                                        value={customer.name + " " + customer.phone} // Search by both
                                        onSelect={(currentValue) => {
                                            const id = customer.id?.toString() || ""
                                            onChange(id === value ? "" : id)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === customer.id?.toString() ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span>{customer.name}</span>
                                            <span className="text-xs text-muted-foreground">{customer.phone}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <AddCustomerDialog
                open={isAddDialogOpen}
                onOpenChange={(v) => {
                    setIsAddDialogOpen(v);
                    // Refresh logic if needed, but store handles it locally? Store auto-refreshes on add.
                    if (!v) fetchCustomers();
                }}
            />
        </>
    )
}
