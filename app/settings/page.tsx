'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Store, Globe, Receipt, Database, Trash2, Download, Upload, AlertTriangle } from 'lucide-react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { db } from '@/lib/db';

export default function SettingsPage() {
    const t = useTranslations('Settings');

    // State for form fields
    const [shopName, setShopName] = useState('');
    const [shopAddress, setShopAddress] = useState('');
    const [shopPhone, setShopPhone] = useState('');
    const [shopEmail, setShopEmail] = useState('');
    const [currency, setCurrency] = useState('BDT (৳)');
    const [taxRate, setTaxRate] = useState('0');
    const [invoiceFooter, setInvoiceFooter] = useState('');

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('shopSettings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setShopName(parsed.shopName || 'Inventory Shop');
            setShopAddress(parsed.shopAddress || 'Dhaka, Bangladesh');
            setShopPhone(parsed.shopPhone || '');
            setShopEmail(parsed.shopEmail || '');
            setCurrency(parsed.currency || 'BDT (৳)');
            setTaxRate(parsed.taxRate || '0');
            setInvoiceFooter(parsed.invoiceFooter || '');
        } else {
            // Defaults
            setShopName('Inventory Shop');
            setShopAddress('Dhaka, Bangladesh');
            setTaxRate('0');
        }
    }, []);

    const handleSave = () => {
        const settings = {
            shopName,
            shopAddress,
            shopPhone,
            shopEmail,
            currency,
            taxRate,
            invoiceFooter
        };
        localStorage.setItem('shopSettings', JSON.stringify(settings));
        toast.success(t('saved'));
    };

    const handleClearData = async () => {
        if (confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
            try {
                await db.sales.clear();
                await db.products.clear();
                await db.categories.clear();
                toast.success('All data cleared successfully');
                window.location.reload();
            } catch (error) {
                console.error(error);
                toast.error('Failed to clear data');
            }
        }
    };

    const handleExportData = async () => {
        try {
            const sales = await db.sales.toArray();
            const products = await db.products.toArray();
            const categories = await db.categories.toArray();
            const data = { sales, products, categories, date: new Date().toISOString() };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `inventory-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Backup downloaded successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to export data');
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('title')}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">{t('description')}</p>
            </div>

            <Tabs defaultValue="general" className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-64 flex-shrink-0">
                    <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-2">
                        <TabsTrigger
                            value="general"
                            className="w-full justify-start px-4 py-3 h-auto data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
                        >
                            <Store className="mr-2 h-4 w-4" />
                            {t('tabs.general')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="sales"
                            className="w-full justify-start px-4 py-3 h-auto data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
                        >
                            <Receipt className="mr-2 h-4 w-4" />
                            {t('tabs.sales')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="data"
                            className="w-full justify-start px-4 py-3 h-auto data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
                        >
                            <Database className="mr-2 h-4 w-4" />
                            {t('tabs.data')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="appearance"
                            className="w-full justify-start px-4 py-3 h-auto data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-700"
                        >
                            <Globe className="mr-2 h-4 w-4" />
                            {t('tabs.appearance')}
                        </TabsTrigger>
                    </TabsList>
                </aside>

                <div className="flex-1 space-y-6">
                    {/* General Settings */}
                    <TabsContent value="general" className="mt-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('general.title')}</CardTitle>
                                <CardDescription>{t('general.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="shopName">{t('general.shopName')}</Label>
                                    <Input id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="address">{t('general.shopAddress')}</Label>
                                    <Input id="address" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">{t('general.shopPhone')}</Label>
                                        <Input id="phone" value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} placeholder="+880..." />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">{t('general.shopEmail')}</Label>
                                        <Input id="email" type="email" value={shopEmail} onChange={(e) => setShopEmail(e.target.value)} placeholder="info@example.com" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="flex justify-end">
                            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                                <Save className="mr-2 h-4 w-4" /> {t('saveSettings')}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Sales Settings */}
                    <TabsContent value="sales" className="mt-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('sales.title')}</CardTitle>
                                <CardDescription>{t('sales.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="currency">{t('sales.currency')}</Label>
                                        <Input id="currency" value={currency} disabled />
                                        <p className="text-xs text-muted-foreground">Currency change is disabled for now.</p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="tax">{t('sales.taxRate')}</Label>
                                        <Input id="tax" type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
                                    </div>
                                </div>
                                <Separator />
                                <div className="grid gap-2">
                                    <Label htmlFor="footer">{t('sales.invoiceFooter')}</Label>
                                    <Input
                                        id="footer"
                                        value={invoiceFooter}
                                        onChange={(e) => setInvoiceFooter(e.target.value)}
                                        placeholder={t('sales.invoiceFooterPlaceholder')}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <div className="flex justify-end">
                            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                                <Save className="mr-2 h-4 w-4" /> {t('saveSettings')}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Data Settings */}
                    <TabsContent value="data" className="mt-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('data.title')}</CardTitle>
                                <CardDescription>{t('data.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <div className="space-y-0.5">
                                        <h3 className="font-medium text-base">{t('data.export')}</h3>
                                        <p className="text-sm text-muted-foreground">{t('data.exportDesc')}</p>
                                    </div>
                                    <Button variant="outline" onClick={handleExportData}>
                                        <Download className="mr-2 h-4 w-4" /> Export JSON
                                    </Button>
                                </div>

                                <div className="border border-red-200 dark:border-red-900/50 rounded-lg overflow-hidden">
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 border-b border-red-100 dark:border-red-900/50 flex items-center gap-2 text-red-700 dark:text-red-400">
                                        <AlertTriangle className="h-5 w-5" />
                                        <span className="font-bold">{t('data.dangerZone')}</span>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-slate-900 flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <h3 className="font-medium text-red-600 dark:text-red-400">{t('data.clear')}</h3>
                                            <p className="text-sm text-slate-500">{t('data.clearDesc')}</p>
                                        </div>
                                        <Button variant="destructive" onClick={handleClearData}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Clear All Data
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Appearance Settings */}
                    <TabsContent value="appearance" className="mt-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('appearance.title')}</CardTitle>
                                <CardDescription>{t('appearance.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border">
                                    <span className="font-medium">{t('appearance.language')}</span>
                                    <LocaleSwitcher />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border">
                                    <span className="font-medium">{t('appearance.theme')}</span>
                                    <ThemeToggle />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
