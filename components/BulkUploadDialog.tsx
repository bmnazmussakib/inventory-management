'use client';

import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, Trash2, Database, Loader2, FileUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { parseExcel, parseJson, validateProducts, ValidationError, downloadTemplate } from '@/lib/bulk-upload-utils';
import { db, type Product } from '@/lib/db';
import { toBanglaNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useProductStore } from '@/stores/product-store';
import { useTranslations } from 'next-intl';

export function BulkUploadDialog() {
    const t = useTranslations('BulkUpload');
    const commonT = useTranslations('Common');
    const productsT = useTranslations('Products');

    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewData, setPreviewData] = useState<Product[]>([]);
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { fetchProducts } = useProductStore();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const extension = selectedFile.name.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'json'].includes(extension || '')) {
            toast.error('ভুল ফাইল ফরম্যাট! .xlsx, .xls অথবা .json ফাইল ব্যবহার করুন।');
            return;
        }

        setFile(selectedFile);
        setIsParsing(true);
        setPreviewData([]);
        setErrors([]);

        try {
            let rawData: any[] = [];
            if (extension === 'json') {
                rawData = await parseJson(selectedFile);
            } else {
                rawData = await parseExcel(selectedFile);
            }

            const { valid, errors: validationErrors } = await validateProducts(rawData);
            setPreviewData(valid);
            setErrors(validationErrors);

            if (validationErrors.length > 0) {
                toast.warning(`${toBanglaNumber(validationErrors.length)}টি ফিল্ডে সমস্যা পাওয়া গেছে।`);
            } else {
                toast.success(`${toBanglaNumber(valid.length)}টি পণ্য পাওয়া গেছে।`);
            }
        } catch (err) {
            console.error('File parsing error:', err);
            toast.error('ফাইলটি পড়তে সমস্যা হয়েছে।');
        } finally {
            setIsParsing(false);
        }
    };

    const handleUpload = async () => {
        if (previewData.length === 0) return;

        setIsUploading(true);
        try {
            const existingProducts = await db.products.toArray();
            const existingNames = new Set(existingProducts.map(p => p.name.toLowerCase()));

            const newProducts = previewData.filter(p => !existingNames.has(p.name.toLowerCase()));
            const duplicatesCount = previewData.length - newProducts.length;

            if (newProducts.length > 0) {
                await db.products.bulkAdd(newProducts);
                toast.success(`${toBanglaNumber(newProducts.length)}টি নতুন পণ্য যোগ করা হয়েছে।`);
            }

            if (duplicatesCount > 0) {
                toast.info(`${toBanglaNumber(duplicatesCount)}টি পণ্য আগে থেকেই ছিল বলে স্কিপ করা হয়েছে।`);
            }

            await fetchProducts();
            handleClose();
        } catch (err) {
            console.error('Upload error:', err);
            toast.error('পণ্যগুলো সেভ করতে সমস্যা হয়েছে।');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setFile(null);
        setPreviewData([]);
        setErrors([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto border-dashed border-primary/50 hover:border-primary">
                    <FileUp className="mr-2 h-4 w-4" /> {commonT('bulkUpload')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-2xl">
                                <Upload className="h-6 w-6 text-primary" />
                                {t('formTitle')}
                            </DialogTitle>
                            <DialogDescription>
                                {t('formDescription')}
                            </DialogDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => downloadTemplate()} className="gap-2">
                            <Download className="h-4 w-4" /> {t('downloadTemplate')}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-6">
                    {/* File Selection Area */}
                    <div
                        className={cn(
                            "relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer",
                            file ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50 hover:bg-muted/30"
                        )}
                        onClick={() => !isParsing && fileInputRef.current?.click()}
                    >
                        <Input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".xlsx,.xls,.json"
                            className="hidden"
                        />
                        {isParsing ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                <p className="text-sm font-medium">{t('processing')}</p>
                            </div>
                        ) : file ? (
                            <div className="flex flex-col items-center gap-2 text-center">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <CheckCircle2 className="h-6 w-6 text-primary" />
                                </div>
                                <p className="font-bold text-sm">{file.name}</p>
                                <Button variant="link" size="sm" className="h-auto p-0 text-red-500" onClick={(e) => {
                                    e.stopPropagation();
                                    setFile(null);
                                    setPreviewData([]);
                                    setErrors([]);
                                }}>{t('remove')}</Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-center">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <p className="text-sm">{t('dropzone.text')}</p>
                                <p className="text-xs text-muted-foreground">{t('dropzone.subtext')}</p>
                            </div>
                        )}
                    </div>

                    {/* Preview & Errors */}
                    {(previewData.length > 0 || errors.length > 0) && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            {errors.length > 0 && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                    <h4 className="text-sm font-bold text-red-600 flex items-center gap-2 mb-2">
                                        <AlertCircle className="h-4 w-4" /> {t('errors')}:
                                    </h4>
                                    <ScrollArea className="h-32">
                                        <ul className="text-xs space-y-1 text-red-700/80">
                                            {errors.map((err, i) => (
                                                <li key={i}>• রো {toBanglaNumber(err.row)}: {err.message}</li>
                                            ))}
                                        </ul>
                                    </ScrollArea>
                                </div>
                            )}

                            {previewData.length > 0 && (
                                <div className="rounded-xl border border-muted overflow-hidden">
                                    <div className="bg-muted/30 px-4 py-2 border-b">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            {t('preview')} ({toBanglaNumber(previewData.length)})
                                        </p>
                                    </div>
                                    <ScrollArea className="h-[350px]">
                                        <Table>
                                            <TableHeader className="bg-muted/50 text-[10px] uppercase font-bold sticky top-0 z-10">
                                                <TableRow>
                                                    <TableHead className="min-w-[150px]">{productsT('table.name')}</TableHead>
                                                    <TableHead className="min-w-[100px]">{productsT('table.category')}</TableHead>
                                                    <TableHead className="min-w-[100px]">{productsT('table.brand')}</TableHead>
                                                    <TableHead className="min-w-[120px]">{productsT('table.ean')}</TableHead>
                                                    <TableHead className="text-right min-w-[80px]">{productsT('table.sellPrice')}</TableHead>
                                                    <TableHead className="text-right min-w-[80px]">{productsT('table.stock')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {previewData.map((p, i) => (
                                                    <TableRow key={i} className="text-xs">
                                                        <TableCell className="font-medium">{p.name}</TableCell>
                                                        <TableCell>{p.category}</TableCell>
                                                        <TableCell>{p.brand || '-'}</TableCell>
                                                        <TableCell className="font-mono text-[10px]">{p.ean || '-'}</TableCell>
                                                        <TableCell className="text-right font-bold text-primary">{toBanglaNumber(p.sellPrice)}</TableCell>
                                                        <TableCell className="text-right">{toBanglaNumber(p.stock)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t bg-muted/10 gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={handleClose} disabled={isUploading}>{t('cancel')}</Button>
                    <Button
                        onClick={handleUpload}
                        disabled={isUploading || previewData.length === 0}
                        className="rounded-xl shadow-lg shadow-primary/20"
                    >
                        {isUploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Database className="mr-2 h-4 w-4" />
                        )}
                        {t('saveToInventory')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
