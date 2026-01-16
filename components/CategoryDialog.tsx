'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCategoryStore } from '@/stores/category-store';
import { useTranslations } from 'next-intl';
import { type Category } from '@/lib/db';

interface CategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingCategory: Category | null;
}

export function CategoryDialog({ open, onOpenChange, editingCategory }: CategoryDialogProps) {
    const t = useTranslations('Categories');
    const { categories, addCategory, updateCategory } = useCategoryStore();

    const [formData, setFormData] = useState<Omit<Category, 'id'>>({
        name: '',
        parentId: undefined,
        description: ''
    });

    useEffect(() => {
        if (editingCategory) {
            setFormData({
                name: editingCategory.name,
                parentId: editingCategory.parentId,
                description: editingCategory.description || ''
            });
        } else {
            setFormData({
                name: '',
                parentId: undefined,
                description: ''
            });
        }
    }, [editingCategory, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory?.id) {
            await updateCategory(editingCategory.id, formData);
        } else {
            await addCategory(formData);
        }
        onOpenChange(false);
    };

    // Filter out categories that could cause circular references (itself or its children)
    // For simplicity in this version, we'll just prevent setting itself as parent
    const availableParents = categories.filter(c => c.id !== editingCategory?.id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {editingCategory ? t('form.editTitle') : t('form.addTitle')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">{t('form.nameLabel')}</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="parentId">{t('form.parentLabel')}</Label>
                        <Select
                            value={formData.parentId?.toString() || "none"}
                            onValueChange={(val) => setFormData({
                                ...formData,
                                parentId: val === "none" ? undefined : parseInt(val)
                            })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t('form.none')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t('form.none')}</SelectItem>
                                {availableParents.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id!.toString()}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">{t('form.descriptionLabel')}</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="h-24"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" className="w-full">
                            {editingCategory ? t('form.update') : t('form.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
