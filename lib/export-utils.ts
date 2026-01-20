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
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 250]
    });

    const drawDashedLine = (y: number) => {
        if ((doc as any).setLineDashPattern) {
            (doc as any).setLineDashPattern([1, 1], 0);
        } else if ((doc as any).setLineDash) {
            (doc as any).setLineDash([1, 1], 0);
        }
        doc.line(5, y, 75, y);
        // Reset
        if ((doc as any).setLineDashPattern) {
            (doc as any).setLineDashPattern([], 0);
        } else if ((doc as any).setLineDash) {
            (doc as any).setLineDash([], 0);
        }
    };

    const drawSolidLine = (y: number) => {
        if ((doc as any).setLineDashPattern) {
            (doc as any).setLineDashPattern([], 0);
        } else if ((doc as any).setLineDash) {
            (doc as any).setLineDash([], 0);
        }
        doc.line(5, y, 75, y);
    };

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    let currentY = 10;

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Inventory BD', 40, currentY, { align: 'center' });

    currentY += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Dhanmondi, Dhaka, Bangladesh', 40, currentY, { align: 'center' });
    currentY += 4;
    doc.text('Phone: +880 1234-567890', 40, currentY, { align: 'center' });

    currentY += 3;
    drawDashedLine(currentY);

    currentY += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CASH MEMO', 40, currentY, { align: 'center' });

    // Meta
    currentY += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    const dateStr = sale.date ? new Date(sale.date).toLocaleDateString() : new Date().toLocaleDateString();

    doc.text(`Date: ${dateStr}`, 5, currentY);
    doc.text(`Bill No: #${sale.id || '---'}`, 75, currentY, { align: 'right' });

    currentY += 2;
    drawDashedLine(currentY);

    // Items
    const body = sale.items.map((item: any) => [
        item.scheme ? `${item.name}\n(Offer: ${item.scheme})` : item.name,
        (item.qty || 0).toString(),
        ((item.price || 0) * (item.qty || 0)).toFixed(2)
    ]);

    autoTable(doc, {
        body: body,
        startY: currentY + 2,
        margin: { left: 5, right: 5 },
        styles: {
            fontSize: 8,
            cellPadding: 2,
            textColor: [0, 0, 0],
            font: 'helvetica',
            valign: 'middle'
        },
        head: [['Product', 'Qty', 'Price']],
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineWidth: { bottom: 0.1 },
            lineColor: [200, 200, 200]
        },
        columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 10, halign: 'center' },
            2: { cellWidth: 20, halign: 'right' }
        },
        theme: 'plain',
        didParseCell: (data) => {
            // Add bottom border to body rows to mimic 'divide-y'
            if (data.section === 'body') {
                data.cell.styles.lineWidth = { bottom: 0.1 };
                data.cell.styles.lineColor = [240, 240, 240];
            }
        }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 4;

    drawSolidLine(finalY);

    // Footer
    currentY = finalY + 5;

    doc.setFontSize(8);
    doc.text('Subtotal:', 5, currentY);
    doc.text(`${(sale.subtotal || 0).toFixed(2)}`, 75, currentY, { align: 'right' });

    if (sale.discount > 0) {
        currentY += 4;
        doc.text('Discount:', 5, currentY);
        doc.text(`-${(sale.discount || 0).toFixed(2)}`, 75, currentY, { align: 'right' });
    }

    currentY += 2;
    doc.setLineWidth(0.1);
    doc.line(5, currentY, 75, currentY);

    currentY += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 5, currentY);
    doc.text(`${(sale.total || 0).toFixed(2)}`, 75, currentY, { align: 'right' });

    currentY += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Payment Mode:', 5, currentY);
    doc.text('Cash', 75, currentY, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    currentY += 4;
    drawDashedLine(currentY);

    currentY += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Thank you! Come again.', 40, currentY, { align: 'center' });

    currentY += 4;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for shopping with us!', 40, currentY, { align: 'center' });

    currentY += 5;
    doc.setFontSize(6);
    doc.text('Powered by Inventory BD', 40, currentY, { align: 'center' });

    doc.save(filename);
};
