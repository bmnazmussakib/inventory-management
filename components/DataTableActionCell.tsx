'use client';

import * as React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DataTableActionCellProps<T> {
    data: T;
    onEdit: (data: T) => void;
    onDelete: (data: T) => void;
    titleKey?: string;
}

export function DataTableActionCell<T>({
    data,
    onEdit,
    onDelete,
    titleKey = 'table.action'
}: DataTableActionCellProps<T>) {
    const t = useTranslations();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted rounded-lg">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px] rounded-xl shadow-premium">
                    <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase px-3 py-2">
                        {t('Common.actions')}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => onEdit(data)}
                        className="gap-2 cursor-pointer focus:bg-primary/5 focus:text-primary rounded-lg mx-1"
                    >
                        <Pencil className="h-4 w-4" />
                        {t('Common.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="gap-2 cursor-pointer focus:bg-red-50 focus:text-red-600 text-red-500 rounded-lg mx-1"
                    >
                        <Trash2 className="h-4 w-4" />
                        {t('Common.delete')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            {t('Categories.delete.warning')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('Categories.delete.warning')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl">{t('Common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                onDelete(data);
                                setIsDeleteDialogOpen(false);
                            }}
                            className="bg-red-600 hover:bg-red-700 rounded-xl"
                        >
                            {t('Common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
