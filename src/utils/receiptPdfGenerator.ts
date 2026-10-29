import { jsPDF } from 'jspdf';
import { OrderItem } from '../types';

export interface OrderReceiptData {
  orderId: string;
  orderDocId?: string;
  customerName: string;
  phone: string;
  shippingAddress: string;
  deliveryOption?: string;
  deliveryLocationLabel?: string;
  items: OrderItem[];
  subtotal: number;
  promoCode?: string | null;
  discountAmount?: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentScreenshotUrl?: string | null;
  orderStatus: string;
  createdAt?: any;
  createdOrderMessage?: string;
}

/**
 * Generates and downloads a clean, luxury digital PDF receipt for Panchu customers
 */
export function generateReceiptPdf(order: OrderReceiptData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Background tint
  doc.setFillColor(252, 252, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top header accent line
  doc.setFillColor(37, 99, 235); // Panchu Blue Accent
  doc.rect(margin, y, contentWidth, 2, 'F');
  y += 10;

  // Brand Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(24, 24, 27); // #18181b
  doc.text('PANCHU', margin, y);

  // Subtitle / Store metadata (Right aligned)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(113, 113, 122);
  doc.text('ORDER RECEIPT', pageWidth - margin, y - 2, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(37, 99, 235);
  doc.text(order.orderId || '#000', pageWidth - margin, y + 4, { align: 'right' });

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(113, 113, 122);
  doc.text('Luxury Streetwear & Heavyweight Apparel • Kathmandu, Nepal', margin, y);
  y += 8;

  // Thin separator
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Order Info Box (Two columns: Customer details & Order metadata)
  const boxTop = y;
  const colWidth = (contentWidth - 6) / 2;

  // Left column: Customer Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(161, 161, 170);
  doc.text('CUSTOMER & DELIVERY DETAILS', margin, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(24, 24, 27);
  doc.text(order.customerName || 'Customer', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(82, 82, 91);
  doc.text(`Phone: ${order.phone || '—'}`, margin, y);
  y += 4.5;

  // Address wrapped
  const addressLines = doc.splitTextToSize(`Address: ${order.shippingAddress || '—'}`, colWidth);
  doc.text(addressLines, margin, y);
  y += addressLines.length * 4;

  if (order.deliveryLocationLabel) {
    const locLines = doc.splitTextToSize(`Region: ${order.deliveryLocationLabel}`, colWidth);
    doc.text(locLines, margin, y);
    y += locLines.length * 4;
  }

  const leftBottom = y;

  // Right column: Order Metadata
  let rightY = boxTop;
  const rightColX = margin + colWidth + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(161, 161, 170);
  doc.text('ORDER SUMMARY DETAILS', rightColX, rightY);
  rightY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(82, 82, 91);

  // Formatted date
  const dateStr = order.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : order.createdAt?.seconds
    ? new Date(order.createdAt.seconds * 1000).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  doc.text(`Order Date: ${dateStr}`, rightColX, rightY);
  rightY += 4.5;

  doc.text(`Payment Method: ${order.paymentMethod || 'Cash on Delivery (COD)'}`, rightColX, rightY);
  rightY += 4.5;

  const paymentStatusText = (order.paymentMethod || '').toLowerCase().includes('cash')
    ? 'Pay on Delivery (Unpaid)'
    : 'Verification Pending (Slip Provided)';

  doc.text(`Payment Status: ${paymentStatusText}`, rightColX, rightY);
  rightY += 4.5;

  doc.text(`Order Status: ${order.orderStatus || 'Confirmed'}`, rightColX, rightY);
  rightY += 4.5;

  // Re-align Y to the lowest column
  y = Math.max(leftBottom, rightY) + 6;

  // Products Table Header
  doc.setFillColor(244, 244, 245);
  doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(82, 82, 91);

  const colItemX = margin + 3;
  const colSizeX = margin + contentWidth * 0.52;
  const colQtyX = margin + contentWidth * 0.67;
  const colPriceX = margin + contentWidth * 0.80;
  const colTotalX = margin + contentWidth - 3;

  doc.text('ITEM DESCRIPTION', colItemX, y + 4.8);
  doc.text('SIZE', colSizeX, y + 4.8);
  doc.text('QTY', colQtyX, y + 4.8);
  doc.text('PRICE', colPriceX, y + 4.8);
  doc.text('TOTAL', colTotalX, y + 4.8, { align: 'right' });

  y += 10;

  // Items List
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  order.items.forEach((item, index) => {
    // Row background striping
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 3.5, contentWidth, 7.5, 'F');
    }

    doc.setTextColor(24, 24, 27);
    doc.setFont('helvetica', 'bold');

    const itemName = item.name || item.productName || 'Apparel Item';
    const truncatedName = itemName.length > 36 ? `${itemName.substring(0, 34)}...` : itemName;
    doc.text(truncatedName, colItemX, y + 1);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(82, 82, 91);
    doc.text(item.size || item.selectedSize || 'M', colSizeX, y + 1);
    doc.text(String(item.quantity || 1), colQtyX, y + 1);
    doc.text(`NPR ${(item.price || 0).toLocaleString()}`, colPriceX, y + 1);

    const rowSubtotal = (item.price || 0) * (item.quantity || 1);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 24, 27);
    doc.text(`NPR ${rowSubtotal.toLocaleString()}`, colTotalX, y + 1, { align: 'right' });

    y += 7.5;
  });

  y += 3;
  doc.setDrawColor(228, 228, 231);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Financial Breakdown (Right-aligned table)
  const calcWidth = 85;
  const calcX = pageWidth - margin - calcWidth;

  const drawRow = (label: string, value: string, isBold: boolean = false, isAccent: boolean = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 9.5 : 8.5);
    doc.setTextColor(isAccent ? 37 : 82, isAccent ? 99 : 82, isAccent ? 235 : 91);
    doc.text(label, calcX, y);
    doc.text(value, pageWidth - margin, y, { align: 'right' });
    y += 5;
  };

  drawRow('Items Subtotal:', `NPR ${order.subtotal.toLocaleString()}`);

  if (order.discountAmount && order.discountAmount > 0) {
    const promoLabel = order.promoCode ? `Promo Discount (${order.promoCode}):` : 'Applied Discount:';
    drawRow(promoLabel, `- NPR ${order.discountAmount.toLocaleString()}`, false, true);
  }

  drawRow('Delivery Charge:', `NPR ${order.deliveryFee.toLocaleString()}`);

  doc.setDrawColor(228, 228, 231);
  doc.line(calcX, y, pageWidth - margin, y);
  y += 3;

  // Grand Total Highlight Box
  doc.setFillColor(244, 244, 245);
  doc.roundedRect(calcX - 3, y - 2, calcWidth + 3, 9, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text('TOTAL AMOUNT:', calcX, y + 4.5);
  doc.setTextColor(37, 99, 235);
  doc.text(`NPR ${order.totalAmount.toLocaleString()}`, pageWidth - margin, y + 4.5, { align: 'right' });

  y += 14;

  // Payment Breakdown Summary Box
  const isCod = (order.paymentMethod || '').toLowerCase().includes('cash');
  const amountPaidNow = isCod ? 0 : order.totalAmount;
  const amountRemaining = isCod ? order.totalAmount : 0;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('PAYMENT BALANCE BREAKDOWN', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Payment Method: ${order.paymentMethod}`, margin + 4, y + 10);
  doc.text(
    `Amount Paid Now: NPR ${amountPaidNow.toLocaleString()}   •   Remaining to Pay on Delivery: NPR ${amountRemaining.toLocaleString()}`,
    margin + 4,
    y + 14.5
  );

  y += 28;

  // Footer notes & Official verification notice
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.text('This digital receipt is generated authoritatively upon order confirmation.', margin, y);
  y += 4;
  doc.text('For order queries, exchanges, or tracking, message our official WhatsApp desk: +977 9706374074', margin, y);
  y += 4;
  doc.text('PANCHU Clothing • www.panchu.store • Kathmandu, Nepal', margin, y);

  // Trigger browser download
  const cleanId = (order.orderId || 'receipt').replace('#', '').trim();
  doc.save(`Panchu-Receipt-${cleanId}.pdf`);
}
