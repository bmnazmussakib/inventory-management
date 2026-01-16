'use client';

import React from 'react';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export function LocaleSwitcher() {
    const router = useRouter();
    const locale = useLocale();

    const handleLocaleChange = (newLocale: string) => {
        // Set cookie for next-intl middleware to pick up
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        // Refresh the current route to apply the new locale
        router.refresh();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground rounded-xl hover:bg-muted relative">
                    <Globe className="h-5 w-5" />
                    <span className="sr-only">Switch Language</span>
                    <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md uppercase border border-background shadow-sm">
                        {locale}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 mt-2 rounded-xl border-muted bg-background/80 backdrop-blur-md shadow-premium">
                <DropdownMenuLabel className="font-medium text-xs text-muted-foreground uppercase tracking-wider px-3 py-2">
                    ভাষা / Language
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-muted/50" />
                <DropdownMenuItem
                    className={cn(
                        "cursor-pointer rounded-lg mx-1 my-0.5 px-3 py-2 flex justify-between items-center transition-colors",
                        locale === 'bn' ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted font-bengali"
                    )}
                    onClick={() => handleLocaleChange('bn')}
                >
                    বাংলা (Bengali)
                    {locale === 'bn' && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                    className={cn(
                        "cursor-pointer rounded-lg mx-1 my-0.5 px-3 py-2 flex justify-between items-center transition-colors",
                        locale === 'en' ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted"
                    )}
                    onClick={() => handleLocaleChange('en')}
                >
                    English
                    {locale === 'en' && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Helper for cn if not available in this scope, but it should be via @/lib/utils
import { cn } from '@/lib/utils';
