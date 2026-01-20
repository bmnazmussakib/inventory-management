export const bnNumber = (n: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return n.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit)]);
};

/**
 * Format price based on locale
 */
export const formatPrice = (value: number, locale: string): string => {
    const safeValue = value || 0;
    const formatted = safeValue.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    if (locale === 'bn') {
        return `৳ ${formatted}`;
    }
    return `BDT ${formatted}`;
};

export const toBanglaNumber = bnNumber;

export const formatCurrency = (n: number | string): string => {
    const val = typeof n === 'number' ? n : parseFloat(n);
    return formatPrice(val, 'bn'); // Defaulting to BN for existing usages
};

export const formatBanglaDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('bn-BD', {
        hour12: true,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
