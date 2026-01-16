'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    BarChart3
} from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Sales', href: '/sales', icon: ShoppingCart },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
];

export function MobileBottomNav() {
    const pathname = usePathname();

    return (
        <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t px-4 pb-safe">
            <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "inline-flex flex-col items-center justify-center px-5 transition-colors group",
                            pathname === item.href ? "text-primary font-bold" : "text-muted-foreground hover:text-primary"
                        )}
                    >
                        <item.icon className={cn("w-5 h-5 mb-1 transition-transform group-hover:scale-110", pathname === item.href && "scale-110")} />
                        <span className="text-[10px]">{item.name}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
