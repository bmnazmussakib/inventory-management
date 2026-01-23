'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileType, CheckCircle2, AlertCircle, Trash2, Database, Loader2 } from 'lucide-react';
import { useCategoryStore } from '@/stores/category-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { parseExcel, parseJson, validateProducts, ValidationError } from '@/lib/bulk-upload-utils';
import { db, type Product } from '@/lib/db';
import { formatCurrency, toBanglaNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

export function BulkUploadForm() {
    const [file, setFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewData, setPreviewData] = useState<Product[]>([]);
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { fetchCategories } = useCategoryStore();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const extension = selectedFile.name.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'json'].includes(extension || '')) {
            toast.error('ভুল ফাইল ফরম্যাট! দয়া করে .xlsx, .xls অথবা .json ফাইল ব্যবহার করুন।');
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

            // Localized toast for processing categories
            toast.info("ক্যাটাগরি অটো তৈরি হচ্ছে...", {
                description: "প্যারেন্ট ক্যাটাগরি এবং সাব-ক্যাটাগরি অনুসন্ধান ও যোগ করা হচ্ছে।",
                duration: 4000
            });

            const { valid, errors: validationErrors } = await validateProducts(rawData);
            setPreviewData(valid);
            setErrors(validationErrors);

            // Fetch categories again in case new ones were created during validation
            await fetchCategories();

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
            // Find duplicates by name
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

            // Refresh categories one last time to be sure
            await fetchCategories();

            // Reset
            setFile(null);
            setPreviewData([]);
            setErrors([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error('Upload error:', err);
            toast.error('পণ্যগুলো সেভ করতে সমস্যা হয়েছে।');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClear = () => {
        setFile(null);
        setPreviewData([]);
        setErrors([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-6">
            <Card className="border-muted bg-background/50 backdrop-blur-sm shadow-premium overflow-hidden">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <Upload className="h-6 w-6 text-primary" />
                        বাল্ক প্রোডাক্ট আপলোড
                    </CardTitle>
                    <CardDescription>
                        Excel (.xlsx, .xls) অথবা JSON ফাইল আপলোড করে একবারে অনেক পণ্য যোগ করুন।
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div
                        className={cn(
                            "group relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 transition-all duration-300",
                            file ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50 hover:bg-muted/20"
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
                            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                <p className="text-lg font-medium text-muted-foreground">ফাইল প্রসেসিং হচ্ছে...</p>
                            </div>
                        ) : file ? (
                            <div className="flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in duration-300">
                                <div className="p-4 bg-primary/10 rounded-full">
                                    <FileType className="h-10 w-10 text-primary" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">{toBanglaNumber((file.size / 1024).toFixed(2))} KB</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClear();
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" /> বাতিল করুন
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="p-4 bg-muted rounded-full group-hover:bg-primary/10 transition-colors">
                                    <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-bold">এখানে ক্লিক করুন অথবা ড্র্যাগ অ্যান্ড ড্রপ করুন</p>
                                    <p className="text-sm text-muted-foreground">সমর্থিত ফরম্যাট: .xlsx, .xls, .json</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Preview Section */}
            {(previewData.length > 0 || errors.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="lg:col-span-2 border-muted bg-background/50 shadow-premium">
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
                            <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    পণ্য প্রিভিউ
                                </CardTitle>
                                <CardDescription>
                                    মোট {toBanglaNumber(previewData.length)}টি বৈধ পণ্য পাওয়া গেছে
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[400px]">
                                <Table>
                                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead>নাম</TableHead>
                                            <TableHead>ক্যাটাগরি</TableHead>
                                            <TableHead className="text-right">মূল্য (৳)</TableHead>
                                            <TableHead className="text-right">স্টক</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.map((p, idx) => (
                                            <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-medium">{p.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{p.category}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{toBanglaNumber(p.sellPrice)}</TableCell>
                                                <TableCell className="text-right font-bold text-primary">{toBanglaNumber(p.stock)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="p-4 border-t bg-muted/10 flex justify-end">
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading || previewData.length === 0}
                                className="rounded-xl px-8 shadow-lg shadow-primary/20"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> প্রসেসিং...
                                    </>
                                ) : (
                                    <>
                                        <Database className="mr-2 h-4 w-4" /> ইনভেন্টরিতে যোগ করুন
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="border-muted bg-background/50 shadow-premium">
                        <CardHeader className="border-b bg-muted/20">
                            <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                                <AlertCircle className="h-5 w-5" />
                                ত্রুটি সমূহ ({toBanglaNumber(errors.length)})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {errors.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-2">
                                    <CheckCircle2 className="h-10 w-10 text-green-500/50" />
                                    <p>কোন ত্রুটি পাওয়া যায়নি</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[350px]">
                                    <div className="space-y-3">
                                        {errors.map((error, idx) => (
                                            <div key={idx} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
                                                <p className="font-bold text-red-600">রো {toBanglaNumber(error.row)}:</p>
                                                <p className="text-muted-foreground">{error.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
