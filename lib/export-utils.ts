import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to CSV
 */
export const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            const escaped = ('' + val).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Export data to Excel
 */
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Report') => {
    if (data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Write and download
    XLSX.writeFile(workbook, filename);
};

/**
 * Export data to PDF
 * Note: Bangla support in PDF usually requires embedding a .ttf font.
 * For now, we use the default font.
 */
export const exportToPDF = (data: any[], filename: string, title: string) => {
    if (data.length === 0) return;

    const doc = new jsPDF();
    const headers = Object.keys(data[0]);
    const body = data.map(item => headers.map(header => item[header]));

    doc.text(title, 14, 15);

    autoTable(doc, {
        head: [headers],
        body: body,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] }, // Brand primary color
    });

    doc.save(filename);
};

/**
 * Export receipt to PDF
 */
export const exportReceiptToPDF = (sale: any, filename: string) => {
    const doc = new jsPDF({
        unit: 'mm',
        format: [80, 150] // Fixed width, flexible height
    });

    doc.setFontSize(12);
    doc.text('Inventory BD', 40, 10, { align: 'center' });

    doc.setFontSize(8);
    doc.text('Dhanmondi, Dhaka', 40, 15, { align: 'center' });
    doc.text(`Date: ${new Date(sale.date).toLocaleDateString()}`, 40, 20, { align: 'center' });

    doc.line(5, 25, 75, 25);

    const body = sale.items.map((item: any) => [
        item.scheme ? `${item.name}\n(Offer: ${item.scheme})` : item.name,
        item.qty.toString(),
        (item.price * item.qty).toString()
    ]);

    autoTable(doc, {
        body: body,
        startY: 30,
        margin: { left: 5, right: 5 },
        styles: { fontSize: 7, cellPadding: 1 },
        columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 10, halign: 'center' },
            2: { cellWidth: 20, halign: 'right' }
        },
        theme: 'plain'
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.line(5, finalY - 5, 75, finalY - 5);

    doc.setFontSize(8);
    doc.text(`Subtotal: BDT ${sale.subtotal || sale.total}`, 75, finalY, { align: 'right' });

    let currentY = finalY;
    if (sale.discount > 0) {
        currentY += 5;
        doc.text(`Discount: BDT ${sale.discount}`, 75, currentY, { align: 'right' });
    }

    currentY += 8;
    doc.setFontSize(10);
    doc.text(`Total: BDT ${sale.total}`, 75, currentY, { align: 'right' });

    doc.setFontSize(8);
    doc.text('Thank you! Come again.', 40, currentY + 10, { align: 'center' });

    doc.save(filename);
};
