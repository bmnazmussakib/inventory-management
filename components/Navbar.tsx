'use client';

import React from 'react';
import Link from 'next/link';
import {
    Bell,
    Search,
    User,
    Settings,
    LogOut,
    Box,
    Upload,
    Trash2,
    Package,
    Calendar,
    ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { useTranslations } from 'next-intl';
import { useNotificationStore } from '@/stores/notification-store';
import { useNotificationScanner } from '@/hooks/use-notification-scanner';
import { toBanglaNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export function Navbar() {
    const t = useTranslations('Common');
    const nt = useTranslations('Notifications');
    const { notifications, removeNotification, clearAll } = useNotificationStore();
    const router = useRouter();
    const locale = useLocale();

    // Initialize the scanner
    useNotificationScanner();

    const hasNotifications = notifications.length > 0;

    return (
        <nav className="fixed top-0 right-0 z-20 flex h-16 w-full md:w-[calc(100%-17rem)] items-center justify-between glass-panel px-4 md:px-8 transition-all duration-300">
            {/* Left: App Logo (Visible on mobile, hidden on desktop if sidebar is present) */}
            <div className="flex items-center gap-2 md:hidden">
                <Link href="/" className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary rounded-lg">
                        <Box className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">
                        Inventory <span className="text-primary font-bengali">BD</span>
                    </span>
                </Link>
            </div>

            {/* Center: Search */}
            <div className="hidden sm:flex flex-1 max-w-md mx-4">
                <div className="relative w-full group">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        type="search"
                        placeholder={t('search')}
                        className="w-full pl-9 bg-muted/30 border-muted focus-visible:ring-primary/20 transition-all rounded-xl focus:bg-background focus:border-primary/50"
                    />
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 md:gap-4">
                {/* Notifications */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="relative">
                            <Button variant="ghost" size="icon" className="text-muted-foreground rounded-xl hover:bg-muted">
                                <Bell className={cn("h-5 w-5", hasNotifications && "animate-tada")} />
                                <span className="sr-only">{t('notifications')}</span>
                            </Button>
                            {hasNotifications && (
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-red text-white p-0 flex items-center justify-center text-[10px] border-2 border-background shadow-vibrant animate-in zoom-in font-bold">
                                    {locale === 'bn' ? toBanglaNumber(notifications.length) : notifications.length}
                                </Badge>
                            )}
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80 mt-2 p-0 rounded-2xl border-muted bg-background/80 backdrop-blur-lg shadow-premium" align="end">
                        <div className="flex items-center justify-between p-4 border-b">
                            <DropdownMenuLabel className="p-0 font-bold text-base">{nt('title')}</DropdownMenuLabel>
                            {hasNotifications && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-[11px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        clearAll();
                                    }}
                                >
                                    {t('clearAll')}
                                </Button>
                            )}
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {!hasNotifications ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Bell className="h-8 w-8 opacity-20 mb-2" />
                                    <p className="text-sm font-medium">{t('noNotifications')}</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className="group relative flex items-start gap-3 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => {
                                            router.push('/products');
                                        }}
                                    >
                                        <div className={cn(
                                            "mt-1 p-2 rounded-xl flex-shrink-0",
                                            notification.type === 'low_stock' ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"
                                        )}>
                                            {notification.type === 'low_stock' ? <Package className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold leading-tight mb-1">{notification.message}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                                                {new Date(notification.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeNotification(notification.id);
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                        {hasNotifications && (
                            <div className="p-2 border-t">
                                <Button
                                    variant="ghost"
                                    className="w-full h-9 rounded-xl text-xs font-bold text-primary group"
                                    onClick={() => router.push('/products')}
                                >
                                    {t('viewAll')}
                                    <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </div>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Language Selector */}
                <LocaleSwitcher />

                {/* Bulk Upload Button */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" asChild className="text-muted-foreground rounded-xl hover:bg-muted hidden sm:flex">
                                <Link href="/bulk-upload">
                                    <Upload className="h-5 w-5" />
                                    <span className="sr-only">{t('bulkUpload')}</span>
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('bulkUpload')}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Theme Toggle */}
                <div className="hidden sm:block">
                    <ThemeToggle />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border border-muted ring-offset-background transition-all hover:ring-2 hover:ring-primary/20">
                            <Avatar className="h-full w-full">
                                <AvatarImage src="/avatars/user.png" alt="Admin" />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {locale === 'bn' ? 'আই' : 'AD'}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 mt-2 rounded-xl border-muted bg-background/80 backdrop-blur-md" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal font-bengali">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-bold leading-none">{t('adminUser')}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {t('adminEmail')}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer rounded-lg gap-2 m-1 font-medium">
                            <User className="h-4 w-4" /> <span>{t('profile')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer rounded-lg gap-2 m-1 font-medium">
                            <Settings className="h-4 w-4" /> <span>{t('settings')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer rounded-lg gap-2 m-1 text-red-500 focus:text-red-500 font-bold">
                            <LogOut className="h-4 w-4" /> <span>{t('logout')}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    );
}
