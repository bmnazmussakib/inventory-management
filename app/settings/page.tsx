'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Store, Globe, Receipt } from 'lucide-react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function SettingsPage() {
    const t = useTranslations('Settings');

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h1>
                <p className="text-slate-500 dark:text-slate-400">{t('description')}</p>
            </div>

            <div className="grid gap-6">
                {/* General Settings */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Store className="h-5 w-5" />
                        </div>
                        <h2 className="font-bold text-lg text-slate-900 dark:text-white">Shop Information</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>{t('shopName')}</Label>
                            <Input defaultValue="Inventory Shop" />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('shopAddress')}</Label>
                            <Input defaultValue="Dhaka, Bangladesh" />
                        </div>
                    </div>
                </div>

                {/* Financial Settings */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-600">
                            <Receipt className="h-5 w-5" />
                        </div>
                        <h2 className="font-bold text-lg text-slate-900 dark:text-white">Financial Preferences</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>{t('currency')}</Label>
                            <Input defaultValue="BDT (৳)" disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('taxRate')}</Label>
                            <Input type="number" defaultValue="5" />
                        </div>
                    </div>
                </div>

                {/* App Preferences */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600">
                            <Globe className="h-5 w-5" />
                        </div>
                        <h2 className="font-bold text-lg text-slate-900 dark:text-white">App Preferences</h2>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <span className="font-medium">Language / ভাষা</span>
                            <LocaleSwitcher />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <span className="font-medium">Theme Mode</span>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 font-bold">
                        <Save className="mr-2 h-4 w-4" /> {t('saveSettings')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
