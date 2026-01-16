'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useThemeStore } from '@/stores/theme-store';

export function ThemeToggle() {
    const { setTheme: setNextTheme } = useTheme();
    const { setTheme: setStoreTheme } = useThemeStore();

    const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
        setNextTheme(theme);
        setStoreTheme(theme);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 border-muted rounded-xl bg-background shadow-premium transition-all hover:scale-105 active:scale-95">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-muted bg-background/80 backdrop-blur-md">
                <DropdownMenuItem onClick={() => handleThemeChange('light')} className="gap-2 cursor-pointer rounded-lg m-1">
                    <Sun className="h-4 w-4" /> <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange('dark')} className="gap-2 cursor-pointer rounded-lg m-1">
                    <Moon className="h-4 w-4" /> <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange('system')} className="gap-2 cursor-pointer rounded-lg m-1">
                    <Monitor className="h-4 w-4" /> <span>System</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
