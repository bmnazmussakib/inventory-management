'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    BarChart3,
    Menu,
    Box,
    FileUp,
    Folders
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetHeader,
    SheetTitle
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslations } from 'next-intl';

interface NavItem {
    titleKey: string;
    href: string;
    icon: React.ElementType;
}

export function Sidebar() {
    const pathname = usePathname();
    const t = useTranslations('Common');

    const navItems: NavItem[] = useMemo(() => [
        {
            titleKey: 'dashboard',
            href: '/',
            icon: LayoutDashboard,
        },
        {
            titleKey: 'products',
            href: '/products',
            icon: Package,
        },
        {
            titleKey: 'categories',
            href: '/categories',
            icon: Folders,
        },
        {
            titleKey: 'sales',
            href: '/sales',
            icon: ShoppingCart,
        },
        {
            titleKey: 'bulkUpload',
            href: '/bulk-upload',
            icon: FileUp,
        },
        {
            titleKey: 'reports',
            href: '/reports',
            icon: BarChart3,
        },
    ], []);

    const SidebarContent = ({ pathname }: { pathname: string }) => (
        <div className="flex flex-col h-full py-6">
            <div className="px-6 mb-8">
                <Link href="/" className="flex items-center gap-4 group">
                    <div className="p-2.5 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl shadow-lg shadow-orange-500/20 group-hover:rotate-6 transition-transform duration-500">
                        <Box className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600">
                            Inventory <span className="font-bengali">BD</span>
                        </span>
                        <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-500 rounded-full mt-1" />
                    </div>
                </Link>
            </div>

            <ScrollArea className="flex-1 px-4">
                <nav className="space-y-2 pt-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                                    isActive
                                        ? "bg-gradient-primary text-primary-foreground shadow-vibrant scale-[1.02] active:scale-95"
                                        : "text-muted-foreground hover:bg-primary/5 hover:text-primary hover:translate-x-1"
                                )}
                            >
                                <Icon className={cn(
                                    "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                                    isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"
                                )} />
                                <span className="font-bold tracking-wide">{t(item.titleKey)}</span>
                                {isActive && (
                                    <div className="absolute right-0 h-10 w-1.5 bg-white/20 rounded-l-full backdrop-blur-md" />
                                )}
                                <div className="absolute top-0 left-0 w-1 h-full bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                            </Link>
                        );
                    })}
                </nav>
            </ScrollArea>

            <div className="px-4 mt-auto pt-6 border-t border-muted/50">
                <div className="p-4 bg-primary/5 rounded-2xl flex items-center justify-between border border-primary/10 shadow-inner">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{t('appVersion')} v1.1.0</span>
                    <ThemeToggle />
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar (Floating & Rounded) */}
            <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-2rem)] fixed left-4 top-4 rounded-[2rem] border border-white/20 bg-white/60 dark:bg-card/50 backdrop-blur-xl shadow-soft z-30 transition-all duration-300">
                <SidebarContent pathname={pathname} />
            </aside>

            {/* Mobile Sidebar (Sheet/Drawer) */}
            <div className="md:hidden fixed bottom-6 right-6 z-40">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl shadow-primary/40 hover:scale-105 transition-transform">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[280px] border-r-0">
                        <SheetHeader className="sr-only">
                            <SheetTitle>{t('navMenu')}</SheetTitle>
                        </SheetHeader>
                        <SidebarContent pathname={pathname} />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
