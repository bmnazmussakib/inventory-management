'use client';

import { useEffect, useMemo } from 'react';
import { useSalesStore } from '@/stores/sales-store';
import { useProductStore } from '@/stores/product-store';
import { useCategoryStore } from '@/stores/category-store';
import { useExpenseStore } from '@/stores/expense-store';
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
    Package,
    Calendar,
    Download,
    Lightbulb,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { bnNumber, formatPrice, formatBanglaDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { useTranslations, useLocale } from 'next-intl';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import Link from 'next/link';

export default function ReportsPage() {
    const t = useTranslations('Reports');
    const commonT = useTranslations('Common');
    const locale = useLocale();
    const { products, fetchProducts } = useProductStore();
    // const { categories, fetchCategories } = useCategoryStore();
    const { sales, fetchSales } = useSalesStore();
    const { expenses, fetchExpenses } = useExpenseStore();

    useEffect(() => {
        fetchSales();
        fetchProducts();
        fetchExpenses();
        // fetchCategories();
    }, [fetchSales, fetchProducts, fetchExpenses]);

    // KPI Calculations
    const stats = useMemo(() => {
        // Filter for current month
        const now = new Date();
        const currentMonthSales = sales.filter(s => {
            const d = new Date(s.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });

        const currentMonthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });

        // Calculate Totals
        const totalRevenue = currentMonthSales.reduce((sum, s) => sum + s.total, 0);
        const totalExpenses = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

        // Calculate COGS (Cost of Goods Sold) for current month
        let totalCOGS = 0;
        currentMonthSales.forEach(sale => {
            sale.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                const buyPrice = product?.buyPrice || 0; // Fallback to current buy price
                totalCOGS += buyPrice * item.qty;
            });
        });

        const grossProfit = totalRevenue - totalCOGS;
        const netProfit = grossProfit - totalExpenses;

        return [
            {
                title: 'Total Revenue (Month)',
                value: formatPrice(totalRevenue, locale),
                subValue: `${currentMonthSales.length} orders`,
                change: "Income",
                sentiment: "positive"
            },
            {
                title: 'Total Expenses (Month)',
                value: formatPrice(totalExpenses, locale),
                subValue: `${currentMonthExpenses.length} records`,
                change: "Outgoing",
                sentiment: "negative"
            },
            {
                title: 'Net Profit (Month)',
                value: formatPrice(netProfit, locale),
                subValue: `Gross: ${formatPrice(grossProfit, locale)}`,
                change: netProfit >= 0 ? "Profit" : "Loss",
                sentiment: netProfit >= 0 ? "positive" : "negative"
            }
        ];
    }, [sales, products, expenses, locale, t]);

    // Financial Overview Data (Last 6 Months)
    const financialData = useMemo(() => {
        const data = [];
        const monthNames = locale === 'bn'
            ? ['জানু', 'ফেব', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthIdx = d.getMonth();
            const year = d.getFullYear();

            // Filter data for this month
            const monthlySales = sales.filter(s => {
                const date = new Date(s.date);
                return date.getMonth() === monthIdx && date.getFullYear() === year;
            });

            const monthlyExpenses = expenses.filter(e => {
                const date = new Date(e.date);
                return date.getMonth() === monthIdx && date.getFullYear() === year;
            });

            const revenue = monthlySales.reduce((sum, s) => sum + s.total, 0);
            const expense = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

            // Calculate COGS
            let cogs = 0;
            monthlySales.forEach(sale => {
                sale.items.forEach(item => {
                    const product = products.find(p => p.id === item.productId);
                    cogs += (product?.buyPrice || 0) * item.qty;
                });
            });

            const profit = revenue - cogs - expense;

            data.push({
                name: `${monthNames[monthIdx]}`,
                revenue,
                expense,
                profit
            });
        }
        return data;
    }, [sales, expenses, products, locale]);

    // Sales Trend Data (Last 7 Days)
    const trendData = useMemo(() => {
        const data = [];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const bnDays = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const daySales = sales
                .filter(s => s.date.startsWith(dateStr))
                .reduce((sum, s) => sum + s.total, 0);

            data.push({
                name: locale === 'bn' ? bnDays[d.getDay()] : days[d.getDay()],
                value: daySales,
                date: dateStr
            });
        }
        return data;
    }, [sales, locale]);

    // Top Selling Products
    const topProducts = useMemo(() => {
        const productSales: Record<number, number> = {};
        sales.forEach(s => {
            s.items.forEach(i => {
                productSales[i.productId] = (productSales[i.productId] || 0) + i.qty;
            });
        });

        return Object.entries(productSales)
            .map(([id, qty]) => {
                const product = products.find(p => p.id === Number(id));
                return product ? { ...product, soldQty: qty } : null;
            })
            .filter(Boolean)
            .sort((a: any, b: any) => b.soldQty - a.soldQty)
            .slice(0, 3);
    }, [sales, products]);

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t('title')}</h2>
                    <p className="text-slate-500 dark:text-slate-400">Business performance metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5">
                        <Calendar className="h-4 w-4 text-slate-400 mr-2" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            {locale === 'bn' ? formatBanglaDate(new Date().toISOString()) : new Date().toLocaleDateString()}
                        </span>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90 text-white font-bold shadow-sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
                            <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1",
                                stat.sentiment === 'positive' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            )}>
                                {stat.sentiment === 'positive' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stat.value}</p>
                        <p className="text-xs text-slate-400 mt-2">{stat.subValue}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Financial Overview Chart */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">Monthly Financial Overview</h3>
                        </div>
                        <div className="p-6">
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={financialData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#94A3B8' }}
                                            tickFormatter={(value) => `${value / 1000}k`}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                borderRadius: '12px',
                                                border: '1px solid #E2E8F0',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                            formatter={(value: number) => formatPrice(value, locale)}
                                        />
                                        <Legend />
                                        <Bar dataKey="revenue" name="Revenue" fill="#1a79bc" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="profit" name="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Sales Trend Chart (Previous - keeping for detail) */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">Daily Sales Trend</h3>
                        </div>
                        <div className="p-6">
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                        <Tooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {trendData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="#94a3b8" />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Top Products List */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">Top Selling Products</h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {topProducts.map((product: any) => (
                                <div key={product.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                            <Package className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{product.name}</p>
                                            <p className="text-[10px] text-slate-400">{product.soldQty} times sold</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-primary">{formatPrice(product.price * product.soldQty, locale)}</p>
                                        <p className="text-[10px] text-emerald-500 font-bold">In Stock</p>
                                    </div>
                                </div>
                            ))}
                            {topProducts.length === 0 && (
                                <div className="p-8 text-center text-slate-400 text-sm">No sales data yet</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column (1/3) */}
                <div className="space-y-6">
                    {/* Recent Summary Table */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">Recent Summary</h3>
                        </div>
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                                <TableRow className="border-none hover:bg-transparent">
                                    <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</TableHead>
                                    <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Sales</TableHead>
                                    <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Profit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trendData.slice(0, 5).map((day, i) => (
                                    <TableRow key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 border-slate-100 dark:border-slate-800">
                                        <TableCell className="text-xs font-medium">{new Date(day.date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' })}</TableCell>
                                        <TableCell className="text-xs font-bold text-right">{formatPrice(day.value, locale)}</TableCell>
                                        <TableCell className="text-xs font-bold text-emerald-600 dark:text-emerald-400 text-right">{formatPrice(day.value * 0.2, locale)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                            <Link href="/sales/history" className="block w-full text-[10px] font-bold text-primary hover:underline text-center uppercase tracking-wider">
                                View Full History
                            </Link>
                        </div>
                    </div>

                    {/* Quick Insights */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3 text-primary">
                            <Lightbulb className="h-5 w-5" />
                            <h4 className="font-bold text-sm">Insights</h4>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Your sales peak between <strong>4 PM - 8 PM</strong>. Consider stocking up on top-selling items before this time window.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
