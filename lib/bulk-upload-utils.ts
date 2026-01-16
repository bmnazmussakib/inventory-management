import * as XLSX from 'xlsx';
import { type Product, db } from './db';

export interface ValidationError {
    row: number;
    message: string;
}

export const parseExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                resolve(json);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

export const parseJson = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                resolve(Array.isArray(json) ? json : [json]);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};

export const validateProducts = async (data: any[]): Promise<{ valid: Product[], errors: ValidationError[] }> => {
    const valid: Product[] = [];
    const errors: ValidationError[] = [];

    // Fetch categories for internal mapping
    const categories = await db.categories.toArray();
    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

    const fieldMapping: Record<string, keyof Product> = {
        'Name': 'name',
        'নাম': 'name',
        'name': 'name',
        'Description': 'description',
        'বিবরণ': 'description',
        'description': 'description',
        'Brand': 'brand',
        'ব্র্যান্ড': 'brand',
        'brand': 'brand',
        'Category': 'category',
        'ক্যাটাগরি': 'category',
        'category': 'category',
        'Price': 'buyPrice',
        'Buy Price': 'buyPrice',
        'ক্রয় মূল্য': 'buyPrice',
        'buyPrice': 'buyPrice',
        'sell Price': 'sellPrice',
        'Sell Price': 'sellPrice',
        'বিক্রয় মূল্য': 'sellPrice',
        'sellPrice': 'sellPrice',
        'Currency': 'currency',
        'currency': 'currency',
        'Stock': 'stock',
        'স্টক': 'stock',
        'stock': 'stock',
        'Reorder Level': 'reorderLevel',
        'রিঅর্ডার লেভেল': 'reorderLevel',
        'reorderLevel': 'reorderLevel',
        'EAN': 'ean',
        'Barcode': 'ean',
        'ean': 'ean',
        'Color': 'color',
        'রঙ': 'color',
        'color': 'color',
        'Size': 'size',
        'সাইজ': 'size',
        'size': 'size',
        'Availability': 'availability',
        'availability': 'availability',
        'Internal ID': 'internalId',
        'internalId': 'internalId',
    };

    data.forEach((row, index) => {
        const product: Partial<Product> = {};
        const rowNum = index + 1;

        // Map fields and ignore "Index"
        Object.keys(row).forEach(key => {
            if (key.trim().toLowerCase() === 'index') return;

            const mappedKey = fieldMapping[key.trim()];
            if (mappedKey) {
                let value = row[key];

                // Convert EAN to string to avoid scientific notation
                if (mappedKey === 'ean' && value !== undefined && value !== null) {
                    value = value.toString();
                }

                product[mappedKey] = value;
            }
        });

        // Validation
        if (!product.name || typeof product.name !== 'string' || product.name.trim() === '') {
            errors.push({ row: rowNum, message: 'নাম অবশ্যই থাকতে হবে।' });
            return;
        }

        const sellPrice = parseFloat(product.sellPrice as any);
        if (isNaN(sellPrice) || sellPrice <= 0) {
            errors.push({ row: rowNum, message: `"${product.name}": বিক্রয় মূল্য অবশ্যই ০ এর বেশি হতে হবে।` });
            return;
        }

        const stock = parseInt(product.stock as any);
        if (isNaN(stock) || stock < 0) {
            errors.push({ row: rowNum, message: `"${product.name}": স্টক অবশ্যই থাকতে হবে (০ বা তার বেশি)।` });
            return;
        }

        // Try mapping category name to ID
        const catName = product.category?.toString().trim().toLowerCase();
        const categoryId = catName ? categoryMap.get(catName) : undefined;

        valid.push({
            name: product.name.trim(),
            description: product.description?.toString().trim(),
            brand: product.brand?.toString().trim(),
            category: product.category?.toString().trim() || 'অন্যান্য',
            categoryId: categoryId,
            buyPrice: parseFloat(product.buyPrice as any) || 0,
            sellPrice: sellPrice,
            currency: product.currency?.toString().trim() || 'BDT',
            stock: stock,
            reorderLevel: parseInt(product.reorderLevel as any) || 0,
            ean: product.ean?.toString().trim(),
            color: product.color?.toString().trim(),
            size: product.size?.toString().trim(),
            availability: product.availability?.toString().trim(),
            internalId: product.internalId?.toString().trim(),
        });
    });

    return { valid, errors };
};

export const downloadTemplate = () => {
    const templateData = [
        {
            'Index': 1,
            'Name': 'Sample Product',
            'Description': 'A great product',
            'Brand': 'BrandX',
            'Category': 'Electronics',
            'Price': 100,
            'sell Price': 150,
            'Currency': 'BDT',
            'Stock': 50,
            'Reorder Level': 10,
            'EAN': '1234567890123',
            'Color': 'Red',
            'Size': 'M',
            'Availability': 'In Stock',
            'Internal ID': 'PROD-001'
        }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    // Convert EAN column to string format to be safe
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: 10 })]; // EAN is 11th column (index 10)
        if (cell) cell.t = 's';
    }

    XLSX.writeFile(workbook, 'product_template.xlsx');
};
