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

    useEffect(() => {
        fetchSales();
        fetchProducts();
        // fetchCategories();
    }, [fetchSales, fetchProducts]);

    // KPI Calculations
    const stats = useMemo(() => {
        const todayPrice = sales
            .filter(s => new Date(s.date).toDateString() === new Date().toDateString())
            .reduce((sum, s) => sum + s.total, 0);

        const todayCount = sales
            .filter(s => new Date(s.date).toDateString() === new Date().toDateString())
            .length;

        const currentMonthSales = sales
            .filter(s => new Date(s.date).getMonth() === new Date().getMonth())
            .reduce((sum, s) => sum + s.total, 0);

        // Dummy profit calculation (assuming 20% margin for demo if costPrice is missing)
        const todayProfit = todayPrice * 0.2;

        return [
            {
                title: t('stats.todaysSale'),
                value: formatPrice(todayPrice, locale),
                subValue: `${locale === 'bn' ? bnNumber(todayCount) : todayCount} orders`,
                change: "+12%",
                sentiment: "positive"
            },
            {
                title: 'Today\'s Profit',
                value: formatPrice(todayProfit, locale),
                subValue: "Avg margin 20%",
                change: "+5%",
                sentiment: "positive"
            },
            {
                title: 'Monthly Sales',
                value: formatPrice(currentMonthSales, locale),
                subValue: "vs last month",
                change: "+8%",
                sentiment: "positive"
            }
        ];
    }, [sales, locale, t]);

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
                    {/* Sales Trend Chart */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">Sales Trend</h3>
                            <div className="flex gap-1">
                                <button className="px-2 py-1 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">7 Days</button>
                                <button className="px-2 py-1 text-[10px] font-bold rounded text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">30 Days</button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <p className="text-xs text-slate-400 mb-1">Total Sales (Last 7 Days)</p>
                                <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {formatPrice(trendData.reduce((a, b) => a + b.value, 0), locale)}
                                </h4>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                borderRadius: '12px',
                                                border: '1px solid #E2E8F0',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                            {trendData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="#1a79bc" fillOpacity={0.8 + (index * 0.02)} />
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
