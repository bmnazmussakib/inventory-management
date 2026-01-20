'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useProductStore } from '@/stores/product-store';
import { useSalesStore } from '@/stores/sales-store';
import {
  Banknote,
  TrendingUp,
  AlertTriangle,
  ShoppingBag,
  MoreHorizontal,
  Search,
  ArrowUpRight,
  Package,
  Soup, // For 'Soap'
  GlassWater, // For 'Drink'
  Utensils // For 'Food'
} from 'lucide-react';
import { bnNumber, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const t = useTranslations('Dashboard');
  const commonT = useTranslations('Common');
  const locale = useLocale();

  const { products, fetchProducts } = useProductStore();
  const { sales, fetchSales } = useSalesStore();

  useEffect(() => {
    fetchProducts();
    fetchSales();
  }, [fetchProducts, fetchSales]);

  // --- Dynamic Stats Calculations ---
  const stats = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todaySalesData = sales.filter(s => new Date(s.date).setHours(0, 0, 0, 0) === today);
    const todayTotal = todaySalesData.reduce((sum, s) => sum + s.total, 0);

    // Profit Calculation (Dummy 10% for now or based on buy/sell price if available in older logic)
    // Assuming simple calculation for display
    const todayProfit = todayTotal * 0.15;

    const lowStockItems = products.filter(p => p.stock <= p.reorderLevel);
    const lowStockCount = lowStockItems.length;

    const totalOrders = sales.length; // Simply total orders count

    return [
      {
        title: "আজ বিক্রি (Today's Sale)",
        value: formatPrice(todayTotal, locale),
        icon: Banknote,
        colorClass: "text-primary",
        bgClass: "bg-blue-50 dark:bg-blue-900/30",
        trend: "+12.5%",
        trendColor: "text-green-600 bg-green-50",
      },
      {
        title: "আজকের লাভ (Today's Profit)",
        value: formatPrice(todayProfit, locale),
        icon: TrendingUp,
        colorClass: "text-emerald-600",
        bgClass: "bg-emerald-50 dark:bg-emerald-900/30",
        trend: "+5%",
        trendColor: "text-green-600 bg-green-50",
      },
      {
        title: "কম স্টক (Low Stock)",
        value: `${locale === 'bn' ? bnNumber(lowStockCount) : lowStockCount} items`,
        icon: AlertTriangle,
        colorClass: "text-red-500",
        bgClass: "bg-red-50 dark:bg-red-900/30",
        alert: true,
        trend: "Action Needed",
        trendColor: "text-red-600 bg-red-50"
      },
      {
        title: "মোট অর্ডার (Orders)",
        value: `${locale === 'bn' ? bnNumber(totalOrders) : totalOrders}`,
        icon: ShoppingBag,
        colorClass: "text-purple-600",
        bgClass: "bg-purple-50 dark:bg-purple-900/30",
        trend: "",
        trendColor: ""
      }
    ];
  }, [products, sales, locale]);

  // --- Chart Data (Last 7 Days) ---
  const salesTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const daySales = sales.filter(s => s.date.startsWith(date));
      const total = daySales.reduce((sum, s) => sum + s.total, 0);
      const dayName = new Date(date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'short' });
      return { name: dayName, amount: total };
    });
  }, [sales, locale]);

  // --- Low Stock Items (Top 3) ---
  const lowStockPreview = useMemo(() => {
    return products
      .filter(p => p.stock <= p.reorderLevel)
      .slice(0, 3);
  }, [products]);

  return (
    <div className="space-y-8 pb-24 lg:pb-10">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className={cn(
            "bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm",
            stat.alert && "border-l-4 border-l-red-500"
          )}>
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2 rounded-lg", stat.bgClass)}>
                <stat.icon className={cn("h-6 w-6", stat.colorClass)} />
              </div>
              {stat.trend && (
                <span className={cn("px-2 py-0.5 rounded text-xs font-bold", stat.trendColor)}>
                  {stat.trend}
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.title}</p>
            <h3 className="text-slate-900 dark:text-white text-3xl font-bold mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Chart Section */}
          <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-slate-900 dark:text-white text-lg font-bold">বিক্রয় চার্ট (Sales Trend)</h2>
                <p className="text-slate-500 text-sm">গত ৭ দিনের সারাংশ</p>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-1 rounded-lg border border-slate-100 dark:border-slate-800">
                <button className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-md shadow-sm text-xs font-bold text-slate-700 dark:text-slate-200">সাপ্তাহিক</button>
                <button className="px-3 py-1.5 text-xs text-slate-400 font-bold hover:text-slate-600 transition-colors">মাসিক</button>
              </div>
            </div>

            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a79bc" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1a79bc" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#1a79bc', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#1a79bc"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Dummy days row at bottom if needed, but Recharts XAxis can handle it if we enabled it. Keeping clean as per reference SVG look */}
            <div className="flex justify-between px-2 pt-4 border-t border-slate-50 dark:border-slate-700 font-mono text-xs font-bold text-slate-400 uppercase">
              {salesTrendData.map(d => <span key={d.name}>{d.name}</span>)}
            </div>
          </section>

          {/* Recent Transactions */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-slate-900 dark:text-white text-lg font-bold">সাম্প্রতিক লেনদেন (Recent Sales)</h2>
              <Link href="/reports" className="text-primary text-sm font-semibold hover:underline">সব দেখুন</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs font-bold uppercase">
                  <tr>
                    <th className="px-6 py-4">আইডি</th>
                    <th className="px-6 py-4">কাস্টমার</th>
                    <th className="px-6 py-4 text-center">স্ট্যাটাস</th>
                    <th className="px-6 py-4 text-right">পরিমাণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {/* Dummy/Recent Data from Store */}
                  {sales.slice(0, 5).map((sale, idx) => (
                    <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono">#{String(sale.id).slice(0, 8)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-200">ওয়াক-ইন কাস্টমার</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">পরিশোধিত</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-right text-slate-900 dark:text-slate-200">{formatPrice(sale.total, locale)}</td>
                    </tr>
                  ))}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">কোন লেনদেন পাওয়া যায়নি</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-8">
          {/* Stock Alerts */}
          <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-slate-900 dark:text-white text-lg font-bold">স্টক সতর্কতা (Stock Alert)</h2>
            </div>

            <div className="space-y-4">
              {lowStockPreview.length > 0 ? lowStockPreview.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 rounded-xl border border-red-50 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-red-500 shadow-sm">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{product.name}</p>
                      <p className="text-[11px] text-slate-500">মজুত: {locale === 'bn' ? bnNumber(product.stock) : product.stock} টি</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] px-3 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                    রি-অর্ডার
                  </Button>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-400 text-sm">সব পণ্যের স্টক ঠিক আছে ✅</div>
              )}
            </div>

            <Link href="/products">
              <button className="w-full mt-6 py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 text-sm font-medium hover:border-primary hover:text-primary transition-all">
                ইনভেন্টরি রিপোর্ট দেখুন
              </button>
            </Link>
          </section>

          {/* Pro Upgrade Banner */}
          <div className="bg-gradient-to-br from-primary to-blue-700 p-6 rounded-2xl text-white shadow-xl shadow-primary/20">
            <h4 className="font-bold text-lg mb-2">প্রো ভার্সনে আপগ্রেড করুন</h4>
            <p className="text-white/80 text-sm mb-4">আনলিমিটেড স্টক ম্যানেজমেন্ট এবং কাস্টম রিপোর্টের সুবিধা পান।</p>
            <button className="w-full py-2.5 bg-white text-primary font-bold rounded-lg text-sm shadow-sm hover:bg-slate-50 transition-colors">বিশদ জানুন</button>
          </div>
        </div>
      </div>
    </div>
  );
}
