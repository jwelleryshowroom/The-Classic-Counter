import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const generateInvoicePDF = (transaction) => {
    const doc = new jsPDF();
    const isBooking = transaction.status !== 'completed';
    const typeTitle = isBooking ? 'ORDER BOOKING SLIP' : 'TAX INVOICE';

    // --- Helper for Currency ---
    const formatCurrency = (amount) => Number(amount).toFixed(2);
    const formatDate = (dateString) => format(new Date(dateString), 'dd-MMM-yyyy');
    const formatTime = (dateString) => format(new Date(dateString), 'hh:mm a');

    // --- Header ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('THE CLASSIC COUNTER', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Mahavir Marg, opp. Hotel Shyam Palace', 105, 26, { align: 'center' });
    doc.text('Gandhi Chowk, Kishanganj, Bihar 855108', 105, 31, { align: 'center' });
    doc.text('Ph: +91-8294556416', 105, 36, { align: 'center' });

    // --- Title ---
    doc.setLineWidth(0.5);
    doc.line(14, 40, 196, 40);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(typeTitle, 105, 48, { align: 'center' });

    doc.line(14, 52, 196, 52);

    // --- Meta Info ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    let yPos = 60;
    
    // Left Column
    doc.text(`Ref No: #${transaction.id?.slice(-8).toUpperCase() || 'N/A'}`, 14, yPos);
    doc.text(`Date: ${formatDate(transaction.date)}`, 14, yPos + 6);
    
    // Right Column
    doc.text(`Customer: ${transaction.customer?.name || 'Walk-in'}`, 140, yPos);
    doc.text(`Phone: ${transaction.customer?.phone || 'N/A'}`, 140, yPos + 6);

    // Delivery Info (if booking)
    if (isBooking && transaction.delivery) {
        yPos += 14;
        doc.setFont('helvetica', 'bold');
        doc.text(`Delivery Due: ${formatDate(transaction.delivery.date)} @ ${formatTime('2000-01-01T' + transaction.delivery.time)}`, 14, yPos);
    }

    // --- Items Table ---
    const tableColumn = ["Item", "Qty", "Rate", "Amount"];
    const tableRows = transaction.items.map(item => [
        item.name + (item.note ? `\n(${item.note})` : ''),
        item.qty,
        formatCurrency(item.price),
        formatCurrency(item.price * item.qty)
    ]);

    autoTable(doc, {
        startY: yPos + 10,
        head: [tableColumn],
        body: tableRows,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 90 }, // Item
            1: { cellWidth: 20, halign: 'center' }, // Qty
            2: { cellWidth: 30, halign: 'right' }, // Rate
            3: { cellWidth: 30, halign: 'right' }  // Amount
        },
        didDrawPage: (data) => {
            // Footer on every page if needed, but we do main footer below
        }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // --- Totals ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Right align totals
    const rightMargin = 175; // Align with Amount column roughly
    
    doc.text(`Total Amount:`, 130, finalY);
    doc.text(`${formatCurrency(transaction.totalValue || transaction.amount)}`, 196, finalY, { align: 'right' });

    if (transaction.payment?.advance > 0) {
        doc.text(`Advance Paid:`, 130, finalY + 6);
        doc.text(`${formatCurrency(transaction.payment.advance)}`, 196, finalY + 6, { align: 'right' });
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`Balance Due:`, 130, finalY + 12);
    doc.text(`${formatCurrency(transaction.payment?.balance || 0)}`, 196, finalY + 12, { align: 'right' });

    // --- Footer Notes ---
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Thank you for choosing The Classic Counter!', 105, finalY + 30, { align: 'center' });
    
    return doc;
};
