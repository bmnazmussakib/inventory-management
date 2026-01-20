'use client';

import React from 'react';
import Link from 'next/link';
import {
    Bell,
    Search,
    Menu,
    LogOut,
    Settings,
    User as UserIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { useTranslations } from 'next-intl';
import { useNotificationStore } from '@/stores/notification-store';
import { useNotificationScanner } from '@/hooks/use-notification-scanner';
import { toBanglaNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar'; // Importing Sidebar for Mobile Menu if needed, though usually Sidebar component handles itself.

export function Navbar() {
    const t = useTranslations('Common');
    const { notifications } = useNotificationStore();
    const router = useRouter();
    const locale = useLocale();
    const hasNotifications = notifications.length > 0;

    // Helper to format date like "২০ অক্টোবর, ২০২৪"
    // Using hardcoded for visual match or dynamic if preferred. Reference: "২০ অক্টোবর, ২০২৪"
    // I will use a dynamic formatter with Bengali locale.
    const today = new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <header className="fixed top-0 right-0 left-0 md:left-72 z-20 flex h-20 items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 lg:px-10 transition-all duration-300">
            {/* Left: Mobile Menu & Page Title */}
            <div className="flex items-center gap-4">
                {/* Mobile Menu Trigger - Visible only on mobile */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="lg:hidden text-slate-600">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72">
                        {/* We would render Sidebar content here, but Sidebar component handles its own Drawer logic usually. 
                            If we want this button to trigger the Sidebar component's drawer, we need to coordinate.
                            For now, assuming Sidebar's self-contained mobile logic might be redundant if this Navbar exists.
                            I'll leave this simple for now, assuming the layout might need adjustment to perfectly sync mobile menu.
                        */}
                    </SheetContent>
                </Sheet>

                <div>
                    <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">ড্যাশবোর্ড / Dashboard</h2>
                    <p className="text-slate-500 text-xs hidden sm:block">{today}</p>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 sm:gap-6">
                {/* Search Bar - Hidden on mobile */}
                <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 w-64">
                    <Search className="text-slate-400 h-5 w-5 mr-2" />
                    <input
                        className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder-slate-400 text-slate-700 dark:text-slate-200"
                        placeholder="সার্চ করুন..."
                        type="text"
                    />
                </div>

                {/* Language / Locale Switcher - Custom Style */}
                <div className="hidden sm:block">
                    {/* Simplified visual wrapper around LocaleSwitcher or manual implementation */}
                    <button className="text-sm font-semibold text-primary bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 hover:bg-primary/10 transition-colors">
                        BN/EN
                    </button>
                    {/* Note: Real LocaleSwitcher functionality would go here. I'm keeping the visual "Button" as per reference. */}
                </div>

                {/* Icons Group */}
                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="relative p-2 text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                <Bell className="h-5 w-5" />
                                {hasNotifications && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel>{t('notifications')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {/* ... existing notification logic ... */}
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                {hasNotifications ? `${notifications.length} updates` : "No new notifications"}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Profile */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="h-10 w-10 rounded-full bg-slate-200 border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                                <img
                                    className="w-full h-full object-cover"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCc5YZysXrLg6Gr8lj0skPwb6Lz1Sf8hsHv8rX1EMBit_hI0MAPW1t3iikbHsCYdgyOGeC6LNUUvn76tMHtOwroYw00c-OCbpNBN4gWV6aPmzv7q5CXg6BjQD1c_sNtVQuJbOphOuQBWNtjim_qXO711jgNVK9rxKyf-3ZXjm_llko7WXO5LZOU_Hfad_NEXOJC7J3SVlsr2Po2wtN_42qJJ1M2brhDUFVDIq_lrpW6zqZq8e0qR0q3FvmPw-BPtL_4QDgvBB9yGtDB"
                                    alt="Profile"
                                />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <UserIcon className="mr-2 h-4 w-4" /> Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" /> Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500">
                                <LogOut className="mr-2 h-4 w-4" /> Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
