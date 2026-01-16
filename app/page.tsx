'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useProductStore } from '@/stores/product-store';
import { useCategoryStore } from '@/stores/category-store';
import { useSalesStore } from '@/stores/sales-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Clock,
  MoreHorizontal,
  ArrowUpRight,
  ShoppingCart,
  Zap,
  History as HistoryIcon
} from 'lucide-react';
import { bnNumber, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

export default function Dashboard() {
  const t = useTranslations('Dashboard');
  const commonT = useTranslations('Common');
  const locale = useLocale();

  const { products, fetchProducts } = useProductStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { sales, fetchSales } = useSalesStore();

  useEffect(() => {
    fetchProducts();
    fetchSales();
    fetchCategories();
  }, [fetchProducts, fetchSales, fetchCategories]);

  // Dynamic Calculations
  const stats = useMemo(() => {
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    const todaySalesData = sales.filter(s => new Date(s.date).setHours(0, 0, 0, 0) === today);
    const todayTotal = todaySalesData.reduce((sum, s) => sum + s.total, 0);
    const lowStockCount = products.filter(p => p.stock <= p.reorderLevel).length;
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    const expiringSoonCount = products.filter(p => {
      if (!p.expiryDate) return false;
      const expiry = new Date(p.expiryDate);
      return expiry <= thirtyDaysLater;
    }).length;

    return [
      {
        title: t('totalStock'),
        value: locale === 'bn' ? bnNumber(totalStock) : totalStock,
        label: t('items'),
        icon: Package,
        gradient: "bg-gradient-blue",
        iconColor: "text-blue-600 dark:text-blue-400",
        href: "/products"
      },
      {
        title: t('todaySales'),
        value: formatPrice(todayTotal, locale),
        label: t('comparedToYesterday'),
        icon: TrendingUp,
        gradient: "bg-gradient-green",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        href: "/reports"
      },
      {
        title: t('expiringSoon'),
        value: locale === 'bn' ? bnNumber(expiringSoonCount) : expiringSoonCount,
        label: t('urgent'),
        icon: Calendar,
        gradient: "bg-gradient-red",
        iconColor: "text-rose-600 dark:text-rose-400",
        href: "/products"
      },
      {
        title: t('lowStock'),
        value: locale === 'bn' ? bnNumber(lowStockCount) : lowStockCount,
        label: t('restock'),
        icon: AlertTriangle,
        gradient: "bg-gradient-orange",
        iconColor: "text-orange-600 dark:text-orange-400",
        href: "/products"
      },
    ];
  }, [products, sales, t, locale]);

  // Chart Data: Sales Trend (Last 7 Days)
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

  // Chart Data: Category Distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      const cat = categories.find(c => c.id === p.categoryId)?.name || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [products, categories]);

  // Warm Chart Colors (Orange, Yellow, Teal, Purple)
  const CHART_COLORS = ['#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  // Top Products Calculation
  const topProducts = useMemo(() => {
    const productSales: Record<number, { name: string, totalQty: number, totalRevenue: number }> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.name, totalQty: 0, totalRevenue: 0 };
        }
        productSales[item.productId].totalQty += item.qty;
        productSales[item.productId].totalRevenue += item.price * item.qty;
      });
    });

    return Object.entries(productSales)
      .map(([id, data]) => ({ id: Number(id), ...data }))
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);
  }, [sales]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto p-4 md:p-8 pb-32">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="relative">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground selection:bg-primary/20 selection:text-primary">
            {t('welcomeMessage', { name: 'Admin' })} <span className="text-primary-ui">👋</span>
          </h1>
          <div className="h-2 w-32 bg-gradient-warm rounded-full mt-2" />
          <p className="text-muted-foreground mt-4 text-lg font-medium max-w-md">
            {t('description')}
          </p>
        </div>
        <div className="glass-card-warm px-6 py-3 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <Clock className="h-5 w-5 animate-pulse-subtle" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted-foreground dark:text-gray-400 tracking-widest font-black">{t('currentTime')}</span>
            <span className="text-xl font-bold text-foreground font-mono">{new Date().toLocaleTimeString(locale === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Quick Stats (Circular) & Time Tracker */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.slice(0, 3).map((stat, index) => (
              <Link key={index} href={stat.href} className="group">
                <div className="glass-card-warm p-6 rounded-3xl relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-soft group-hover:bg-white/80">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-3 rounded-2xl transition-colors", stat.iconColor.replace('text-', 'bg-').replace('600', '100').replace('400', '900/20'))}>
                      <stat.icon className={cn("h-6 w-6", stat.iconColor)} />
                    </div>
                    <div className="text-xs font-black bg-white/50 dark:bg-black/20 px-2 py-1 rounded-lg text-muted-foreground dark:text-gray-300 uppercase tracking-widest backdrop-blur-sm">
                      {stat.label}
                    </div>
                  </div>
                  <div className="space-y-1 relative z-10">
                    <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                    <p className="text-3xl font-black text-foreground tracking-tight">{stat.value}</p>
                  </div>
                  {/* Decorative Circle BG */}
                  <div className={cn("absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl transition-transform group-hover:scale-150", stat.gradient.replace('bg-gradient-', 'bg-'))} />
                </div>
              </Link>
            ))}
          </div>

          {/* Main Visual: Sales Chart */}
          <div className="glass-card-warm p-8 rounded-[2rem] flex-1 min-h-[400px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary-ui" />
                  {t('recentActivity')}
                </h2>
                <p className="text-sm text-muted-foreground font-medium mt-1">{t('salesTrendDesc')}</p>
              </div>
              <div className="flex gap-2">
                <div className="px-4 py-2 bg-green-50 text-green-700 rounded-xl font-bold text-xs flex items-center gap-2 border border-green-100">
                  <ArrowUpRight className="h-4 w-4" /> +12.5% {t('growth')}
                </div>
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData}>
                  <defs>
                    <linearGradient id="warmSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#a1a1aa', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', background: 'rgba(255, 255, 255, 0.95)' }}
                    itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
                    cursor={{ stroke: '#f97316', strokeWidth: 2, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="natural"
                    dataKey="amount"
                    stroke="#f97316"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#warmSales)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Category Pie & Top Products */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Category Distribution */}
          <div className="glass-card-warm p-6 rounded-[2rem]">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-500"><Package className="h-4 w-4" /></div>
              {t('inventoryDistribution')}
            </h3>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    cornerRadius={6}
                    animationBegin={200}
                    animationDuration={1500}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-foreground">{locale === 'bn' ? bnNumber(products.length) : products.length}</span>
                <span className="text-xs font-bold text-muted-foreground dark:text-gray-400 uppercase">{t('items')}</span>
              </div>
            </div>
          </div>

          {/* Top Products List */}
          <div className="glass-card-warm p-6 rounded-[2rem] flex-1">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
              <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600"><ShoppingCart className="h-4 w-4" /></div>
              {t('topProducts')}
            </h3>
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm font-medium">{t('noSalesData')}</div>
              ) : (
                topProducts.map((product, i) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/50 transition-colors cursor-default">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm",
                      i === 0 ? "bg-orange-100 text-orange-600" :
                        i === 1 ? "bg-yellow-100 text-yellow-600" :
                          i === 2 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                    )}>
                      {locale === 'bn' ? bnNumber(i + 1) : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{product.name}</p>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full"
                          style={{ width: `${Math.min(100, (product.totalQty / (topProducts[0]?.totalQty || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-black text-foreground">{formatPrice(product.totalRevenue, locale)}</span>
                      <span className="text-[10px] font-bold text-muted-foreground">{locale === 'bn' ? bnNumber(product.totalQty) : product.totalQty} sold</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
