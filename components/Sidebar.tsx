'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Calculator,
    Package,
    BarChart3,
    Users,
    Settings,
    Store,
    PlusCircle,
    Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// Navigation Items matching Reference
const navItems = [
    {
        title: 'ড্যাশবোর্ড',
        subtitle: '(Dashboard)',
        href: '/',
        icon: LayoutDashboard,
    },
    {
        title: 'পিওএস',
        subtitle: '(POS)',
        href: '/sales',
        icon: Calculator, // Representing Point of Sale
    },
    {
        title: 'ইনভেন্টরি',
        subtitle: '(Inventory)',
        href: '/products',
        icon: Package,
    },
    {
        title: 'রিপোর্ট',
        subtitle: '(Reports)',
        href: '/reports',
        icon: BarChart3,
    },
    {
        title: 'কাস্টমার',
        subtitle: '(Customers)',
        href: '/customers',
        icon: Users,
    },
    {
        title: 'সেটিংস',
        subtitle: '(Settings)',
        href: '/settings',
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
            {/* Logo / Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <Store className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">শপ ম্যানেজার</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">Bangladesh Shop Ltd.</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-slate-500")} />
                            <div className="flex flex-col leading-none">
                                <span className={cn("text-sm", isActive ? "font-bold" : "font-medium")}>
                                    {item.title} <span className="opacity-70 text-xs font-normal">{item.subtitle}</span>
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Action */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <Link href="/sales">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                        <PlusCircle className="h-5 w-5" />
                        <span>নতুন বিক্রি (New Sale)</span>
                    </Button>
                </Link>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-72 flex-col fixed top-0 left-0 h-screen z-30">
                <SidebarContent />
            </aside>

            {/* Mobile Trigger - This usually goes in Navbar, but kept here for local testing if needed, 
                though layout.tsx structure separates Navbar and Sidebar. 
                We'll assume Navbar handles the trigger or we just conditionally render sidebar. 
                For this implementation, the layout.tsx expects Sidebar to take up space.
                The previous implementation had a "md:hidden" floating button. 
                I'll leave the trigger logic to the Navbar to match the reference 'menu' button there.
            */}
        </>
    );
}
