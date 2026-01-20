'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCategoryStore } from '@/stores/category-store';
import { useTranslations } from 'next-intl';
import {
    Plus,
    Edit,
    Trash2,
    Layers,
    Search,
    MoreVertical,
    CornerDownRight,
    FolderTree,
    Folder,
    FolderOpen,
    ChevronRight,
    ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface CategoryWithChildren {
    id?: number;
    name: string;
    description?: string;
    parentId?: number;
    children: CategoryWithChildren[];
}

export default function CategoriesPage() {
    const { categories, fetchCategories, addCategory, updateCategory, deleteCategory } = useCategoryStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', description: '', parentId: 'null' });
    const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleToggleExpand = (id: number) => {
        setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Build Tree Structure
    const categoryTree = useMemo(() => {
        const categoryMap = new Map<number, CategoryWithChildren>();

        // Initialize map with all categories
        categories.forEach(c => {
            if (c.id) {
                categoryMap.set(c.id, { ...c, children: [] });
            }
        });

        const roots: CategoryWithChildren[] = [];

        // Build hierarchy
        categories.forEach(c => {
            if (c.id && categoryMap.has(c.id)) {
                const node = categoryMap.get(c.id)!;
                // Filter by search term if active, otherwise build tree
                if (searchTerm) {
                    if (node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                        roots.push(node);
                    }
                } else {
                    if (c.parentId && categoryMap.has(c.parentId)) {
                        categoryMap.get(c.parentId)!.children.push(node);
                    } else {
                        roots.push(node);
                    }
                }
            }
        });

        return roots;
    }, [categories, searchTerm]);

    const handleOpenDialog = (category?: any) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                parentId: category.parentId ? String(category.parentId) : 'null'
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '', parentId: 'null' });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) return;

        try {
            const dataToSave = {
                name: formData.name,
                description: formData.description,
                parentId: formData.parentId === 'null' ? undefined : Number(formData.parentId)
            };

            if (editingCategory) {
                if (dataToSave.parentId === editingCategory.id) {
                    toast.error("Category cannot be its own parent");
                    return;
                }
                await updateCategory(editingCategory.id, dataToSave);
                toast.success('Category updated successfully');
            } else {
                await addCategory(dataToSave);
                toast.success('Category added successfully');
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast.error('Failed to save category');
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this category? This might affect subcategories.')) {
            await deleteCategory(id);
            toast.success('Category deleted');
        }
    };

    // Recursive Category Row Component
    const CategoryRow = ({ node, depth = 0 }: { node: CategoryWithChildren, depth?: number }) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedCategories[node.id!] || searchTerm !== ''; // Always expand if searching

        return (
            <div className="flex flex-col">
                <div
                    className={cn(
                        "flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group",
                        depth === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/30 dark:bg-slate-900/50"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <div style={{ width: `${depth * 24}px` }} className="flex-shrink-0 flex justify-end">
                            {depth > 0 && <CornerDownRight className="h-4 w-4 text-slate-300 dark:text-slate-600 mr-1" />}
                        </div>

                        <div className="flex items-center gap-2">
                            {hasChildren && !searchTerm ? (
                                <button
                                    onClick={() => handleToggleExpand(node.id!)}
                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
                                >
                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                            ) : (
                                <div className="w-6" /> // Spacer
                            )}

                            <div className={cn(
                                "p-2 rounded-lg",
                                depth === 0 ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            )}>
                                {depth === 0 ? <FolderTree className="h-5 w-5" /> : <Folder className="h-4 w-4" />}
                            </div>

                            <div>
                                <h3 className={cn("font-semibold text-slate-900 dark:text-white", depth === 0 ? "text-base" : "text-sm")}>
                                    {node.name}
                                </h3>
                                {node.description && (
                                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{node.description}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-xs text-slate-400 mr-4">
                            ID: {node.id}
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 shadow-sm border border-slate-200 dark:border-slate-700"
                            onClick={() => handleOpenDialog(node)}
                        >
                            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 shadow-sm"
                            onClick={() => node.id && handleDelete(node.id)}
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                    </div>
                </div>

                {isExpanded && node.children.map(child => (
                    <CategoryRow key={child.id} node={child} depth={depth + 1} />
                ))}
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-theme(spacing.20))] overflow-hidden bg-[#f8fafc] dark:bg-slate-900">
            {/* Header */}
            <div className="flex-none p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <Layers className="h-6 w-6 text-primary" />
                        Categories
                    </h1>
                    <p className="text-sm text-slate-500">Manage category hierarchy and organization</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" /> Add New Category
                </Button>
            </div>

            {/* Search */}
            <div className="p-4 flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    />
                </div>
            </div>

            {/* Content - Tree View */}
            <div className="flex-1 overflow-y-auto p-6">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {categoryTree.length > 0 ? (
                            categoryTree.map(node => (
                                <CategoryRow key={node.id} node={node} />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                                <FolderOpen className="h-12 w-12 text-slate-300 mb-3" />
                                <p className="font-medium">No categories found</p>
                                <p className="text-sm mt-1">Get started by adding a new category.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Dialog Form */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            {editingCategory ? <Edit className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                            {editingCategory ? 'Edit Category' : 'Create Category'}
                        </DialogTitle>
                        <DialogDescription>
                            Organize your products by creating hierarchical categories.
                        </DialogDescription>
                    </DialogHeader>

                    <Separator />

                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category Name <span className="text-red-500">*</span></label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Electronics"
                                className="h-10 text-base"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Parent Category</label>
                            <Select
                                value={formData.parentId}
                                onValueChange={(val) => setFormData({ ...formData, parentId: val })}
                            >
                                <SelectTrigger className="h-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                    <SelectValue placeholder="Select Parent Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="null" className="font-semibold text-primary">None (Top Level)</SelectItem>
                                    {categories
                                        .filter(c => c.id !== editingCategory?.id)
                                        .map(cat => (
                                            <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500">Select a parent to make this a sub-category.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Short description for this category"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-10">Cancel</Button>
                        <Button onClick={handleSubmit} className="h-10 bg-primary hover:bg-primary/90 text-white font-bold px-6">
                            {editingCategory ? 'Save Changes' : 'Create Category'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
