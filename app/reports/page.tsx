'use client';

import { useEffect, useMemo } from 'react';
import { useSalesStore } from '@/stores/sales-store';
import { useProductStore } from '@/stores/product-store';
import { useCategoryStore } from '@/stores/category-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    TrendingUp,
    DollarSign,
    ShoppingCart,
    AlertTriangle,
    FileText,
    Tag,
    Download,
    FileDown,
    FileSpreadsheet,
    FileText as PdfIcon,
    History as HistoryIcon,
    Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { bnNumber, formatPrice, formatBanglaDate } from '@/lib/format';
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export-utils';
import { Button } from '@/components/ui/button';
import { useTranslations, useLocale } from 'next-intl';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from 'recharts';

export default function ReportsPage() {
    const t = useTranslations('Reports');
    const commonT = useTranslations('Common');
    const locale = useLocale();
    const { products, fetchProducts } = useProductStore();
    const { categories, fetchCategories } = useCategoryStore();
    const { sales, fetchSales, isLoading } = useSalesStore();

    useEffect(() => {
        fetchSales();
        fetchProducts();
        fetchCategories();
    }, [fetchSales, fetchProducts, fetchCategories]);

    const CHART_COLORS = ['#0070f3', '#22c55e', '#f97316', '#6d28d9', '#ef4444', '#06b6d4'];

    const stats = useMemo(() => {
        const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
        const totalDiscount = sales.reduce((sum, s) => sum + (s.discount || 0), 0);
        const lowStockItems = products.filter(p => p.stock <= p.reorderLevel).length;

        return [
            {
                title: t('stats.totalRevenue'),
                value: formatPrice(totalRevenue, locale),
                icon: DollarSign,
                gradient: "bg-gradient-blue",
                iconColor: "text-blue-600 dark:text-blue-400",
                description: t('stats.totalRevenueDesc')
            },
            {
                title: t('stats.totalTransactions'),
                value: locale === 'bn' ? bnNumber(sales.length) : sales.length,
                icon: ShoppingCart,
                gradient: "bg-gradient-green",
                iconColor: "text-emerald-600 dark:text-emerald-400",
                description: t('stats.orderCount')
            },
            {
                title: t('stats.lowStock'),
                value: locale === 'bn' ? bnNumber(lowStockItems) : lowStockItems,
                icon: AlertTriangle,
                gradient: "bg-gradient-red",
                iconColor: "text-rose-600 dark:text-rose-400",
                description: t('stats.reorderRequired')
            },
            {
                title: t('stats.avgOrder'),
                value: sales.length > 0 ? formatPrice(totalRevenue / sales.length, locale) : formatPrice(0, locale),
                icon: TrendingUp,
                gradient: "bg-gradient-orange",
                iconColor: "text-orange-600 dark:text-orange-400",
                description: t('stats.avgOrderDesc')
            },
            {
                title: t('stats.totalDiscount'),
                value: formatPrice(totalDiscount, locale),
                icon: Tag,
                gradient: "bg-gradient-purple",
                iconColor: "text-violet-600 dark:text-violet-400",
                description: t('stats.totalDiscountDesc')
            }
        ];
    }, [sales, products, t, locale]);

    // Chart: Revenue Trend (Last 30 Days)
    const revenueTrendData = useMemo(() => {
        const days = Array.from({ length: 15 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (14 - i));
            return d.toISOString().split('T')[0];
        });

        return days.map(date => {
            const daySales = sales.filter(s => s.date.startsWith(date));
            const total = daySales.reduce((sum, s) => sum + s.total, 0);
            return {
                name: new Date(date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' }),
                revenue: total
            };
        });
    }, [sales, locale]);

    // Chart: Sales by Category
    const categorySalesData = useMemo(() => {
        const catRevenue: Record<string, number> = {};
        sales.forEach(sale => {
            sale.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                const categoryName = categories.find((c: any) => c.id === product?.categoryId)?.name || 'Uncategorized';
                catRevenue[categoryName] = (catRevenue[categoryName] || 0) + (item.price * item.qty);
            });
        });
        return Object.entries(catRevenue).map(([name, value]) => ({ name, value }));
    }, [sales, products, categories]);

    const lowStockProducts = products.filter(p => p.stock <= p.reorderLevel);

    const handleExportSales = (format: 'csv' | 'excel' | 'pdf') => {
        if (sales.length === 0) {
            toast.error(t('noData'));
            return;
        }
        const data = sales.map(s => ({
            [t('table.date')]: locale === 'bn' ? formatBanglaDate(s.date) : new Date(s.date).toLocaleDateString(),
            [`${t('table.subtotal')} (BDT)`]: s.subtotal || s.total,
            [`${t('table.discount')} (BDT)`]: s.discount || 0,
            [`${t('table.total')} (BDT)`]: s.total,
            [locale === 'bn' ? 'পণ্যের সংখ্যা' : 'Items Count']: s.items.length
        }));
        const filename = `Sales-Report-${new Date().toISOString().split('T')[0]}`;
        if (format === 'csv') exportToCSV(data, `${filename}.csv`);
        else if (format === 'excel') exportToExcel(data, `${filename}.xlsx`, 'Sales');
        else exportToPDF(data, `${filename}.pdf`, t('sales'));
        toast.success(t('exportSuccess', { type: t('sales'), format: format.toUpperCase() }));
    };

    const handleExportStock = (format: 'csv' | 'excel' | 'pdf') => {
        if (products.length === 0) {
            toast.error(t('noData'));
            return;
        }
        const data = products.map(p => ({
            [t('table.product')]: p.name,
            [locale === 'bn' ? 'ক্যাটাগরি' : 'Category']: p.category,
            [`${t('cart.price')} (Sell)`]: p.sellPrice,
            [t('table.stock')]: p.stock,
            [t('table.min')]: p.reorderLevel,
            [locale === 'bn' ? 'মেয়াদ উত্তীর্ণ তারিখ' : 'Expiry Date']: p.expiryDate || 'N/A'
        }));
        const filename = `Inventory-Report-${new Date().toISOString().split('T')[0]}`;
        if (format === 'csv') exportToCSV(data, `${filename}.csv`);
        else if (format === 'excel') exportToExcel(data, `${filename}.xlsx`, 'Products');
        else exportToPDF(data, `${filename}.pdf`, t('inventory'));
        toast.success(t('exportSuccess', { type: t('inventory'), format: format.toUpperCase() }));
    };

    return (
        <div className="space-y-8 pb-20 pt-4 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="relative">
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
                        {t('title')}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg font-medium">
                        {t('description')}
                    </p>
                    <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-primary to-info rounded-full opacity-50" />
                </div>

                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="rounded-2xl shadow-vibrant bg-gradient-primary text-primary-foreground group font-black py-6 px-6 transform hover:scale-105 transition-all">
                                <Download className="h-5 w-5 mr-3 transition-transform group-hover:translate-y-1" />
                                {t('download')}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 rounded-2xl border-muted bg-background/90 backdrop-blur-xl shadow-vibrant" align="end">
                            <DropdownMenuLabel className="font-black text-primary uppercase text-[10px] tracking-widest">{t('inventory')}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleExportStock('csv')} className="cursor-pointer gap-2 font-bold focus:bg-primary/10">
                                <FileDown className="h-4 w-4 text-muted-foreground" /> {t('exportFormat', { format: 'CSV' })}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportStock('excel')} className="cursor-pointer gap-2 font-bold focus:bg-primary/10">
                                <FileSpreadsheet className="h-4 w-4 text-green-600" /> {t('exportFormat', { format: 'Excel' })}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportStock('pdf')} className="cursor-pointer gap-2 font-bold focus:bg-primary/10">
                                <PdfIcon className="h-4 w-4 text-red-500" /> {t('exportFormat', { format: 'PDF' })}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="font-black text-primary uppercase text-[10px] tracking-widest">{t('sales')}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleExportSales('csv')} className="cursor-pointer gap-2 font-bold focus:bg-primary/10">
                                <FileDown className="h-4 w-4 text-muted-foreground" /> {t('exportFormat', { format: 'CSV' })}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportSales('excel')} className="cursor-pointer gap-2 font-bold focus:bg-primary/10">
                                <FileSpreadsheet className="h-4 w-4 text-green-600" /> {t('exportFormat', { format: 'Excel' })}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportSales('pdf')} className="cursor-pointer gap-2 font-bold focus:bg-primary/10">
                                <PdfIcon className="h-4 w-4 text-red-500" /> {t('exportFormat', { format: 'PDF' })}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                {stats.map((stat, index) => (
                    <Card key={index} className={cn(
                        "relative overflow-hidden border border-border/50 bg-card hover:bg-accent/5 transition-all duration-300 shadow-sm hover:shadow-professional group",
                        "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-0 group-hover:before:opacity-100 before:transition-opacity",
                        stat.gradient
                    )}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</CardTitle>
                            <div className={cn("p-2.5 rounded-xl bg-background border border-border/50 shadow-sm transition-transform group-hover:scale-110 duration-300", stat.iconColor)}>
                                <stat.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black tracking-tighter text-foreground">{stat.value}</div>
                            <p className="text-[10px] text-muted-foreground mt-1 font-bold transition-colors uppercase">{stat.description}</p>
                        </CardContent>
                        {/* Decorative side accent blur */}
                        <div className={cn("absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity", stat.iconColor.replace('text-', 'bg-'))} />
                    </Card>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-none shadow-vibrant bg-card/60 backdrop-blur-xl overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-xl font-bold">{t('stats.totalRevenue')} Trend</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#888', fontWeight: 'bold' }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#888' }}
                                        tickFormatter={(val) => `৳${bnNumber(val)}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        fill="url(#revGradient)"
                                        radius={[10, 10, 0, 0]}
                                        animationDuration={2000}
                                    >
                                        <defs>
                                            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#0070f3" />
                                                <stop offset="100%" stopColor="#6d28d9" />
                                            </linearGradient>
                                        </defs>
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-vibrant bg-card/60 backdrop-blur-xl overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-info/10 text-info">
                                <Tag className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-xl font-bold">Revenue by Category</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categorySalesData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        animationDuration={1500}
                                    >
                                        {categorySalesData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                {/* Recent Sales */}
                <Card className="lg:col-span-3 border-none shadow-vibrant bg-card/60 backdrop-blur-xl group">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                                    <HistoryIcon className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-xl font-bold">{t('recentSales')}</CardTitle>
                            </div>
                            <Link href="/sales">
                                <Button variant="ghost" className="text-xs font-bold text-primary hover:bg-primary/10 rounded-xl uppercase tracking-widest">{commonT('actions')}</Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-2xl border border-muted/30 h-[450px] overflow-auto scrollbar-hide">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background/90 backdrop-blur-md z-10">
                                    <TableRow className="bg-muted/30 border-none">
                                        <TableHead className="font-bold text-xs uppercase tracking-tighter">{t('table.date')}</TableHead>
                                        <TableHead className="text-right font-bold text-xs uppercase tracking-tighter">{t('table.total')}</TableHead>
                                        <TableHead className="text-right text-xs uppercase tracking-tighter px-4">Info</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sales.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-20 text-muted-foreground italic">
                                                {t('noSales')}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sales.map((sale) => (
                                            <TableRow key={sale.id} className="hover:bg-primary/5 transition-all duration-300 group/row border-muted/20">
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-foreground/90">
                                                            {locale === 'bn' ? formatBanglaDate(sale.date) : new Date(sale.date).toLocaleDateString()}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground uppercase font-bold">INV-{bnNumber(sale.id || 0)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="text-base font-black text-primary">
                                                        {formatPrice(sale.total, locale)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4 px-4">
                                                    <div className="flex justify-end gap-1">
                                                        <div className="h-2 w-2 rounded-full bg-success" />
                                                        <div className="h-2 w-2 rounded-full bg-primary/20" />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Low Stock Alerts */}
                <Card className="lg:col-span-2 border-none shadow-vibrant bg-red-500/5 group">
                    <CardHeader>
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="p-2.5 rounded-2xl bg-red-100 text-red-600">
                                <AlertTriangle className="h-5 w-5 animate-pulse" />
                            </div>
                            <CardTitle className="text-xl font-bold">{t('urgentReorder')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-2xl border-none h-[450px] overflow-auto scrollbar-hide space-y-4">
                            {lowStockProducts.length === 0 ? (
                                <div className="text-center py-20 text-success font-black italic flex flex-col items-center gap-3">
                                    <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                                        <Check className="h-8 w-8 text-success" />
                                    </div>
                                    {t('allStockGood')}
                                </div>
                            ) : (
                                lowStockProducts.map((product) => (
                                    <div key={product.id} className="bg-background/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-red-100 hover:shadow-md transition-shadow flex items-center justify-between group/item">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-black text-foreground/90 group-hover/item:text-red-600 transition-colors">{product.name}</span>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{product.category}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="text-sm font-black text-red-600 bg-red-50 px-3 py-1 rounded-xl border border-red-100">
                                                {locale === 'bn' ? bnNumber(product.stock) : product.stock} {commonT('stock')}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-bold italic">Min: {locale === 'bn' ? bnNumber(product.reorderLevel) : product.reorderLevel}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
