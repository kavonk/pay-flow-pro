import jsPDF from 'jspdf';
import { InvoiceResponse, BrandingSettingsResponse } from 'types';

export interface PDFInvoiceData {
  invoice: InvoiceResponse;
  branding: BrandingSettingsResponse;
  lineItems?: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal?: number;
  tax?: number;
  discount?: number;
  total: number;
}

export class ProfessionalInvoicePDF {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margins = {
    top: 72, // 1 inch
    right: 72,
    bottom: 72,
    left: 72
  };

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
  }

  // Convert hex color to RGB for jsPDF
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 }; // Default blue
  }

  // Format currency with proper locale
  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  // Add logo if available
  private addLogo(logoUrl: string | null, x: number, y: number, maxWidth: number, maxHeight: number) {
    if (logoUrl) {
      try {
        // For a real implementation, you would load the actual image
        // For now, we'll create a more prominent placeholder
        this.pdf.setFillColor(255, 255, 255, 0.3);
        this.pdf.rect(x, y, maxWidth, maxHeight, 'F');
        this.pdf.setDrawColor(255, 255, 255, 0.5);
        this.pdf.rect(x, y, maxWidth, maxHeight, 'S');
        this.pdf.setTextColor(255, 255, 255);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setFontSize(8);
        this.pdf.text('LOGO', x + maxWidth/2, y + maxHeight/2, { align: 'center' });
      } catch (error) {
        console.warn('Could not load logo:', error);
      }
    } else {
      // Default company initial placeholder
      this.pdf.setFillColor(255, 255, 255, 0.3);
      this.pdf.rect(x, y, maxWidth, maxHeight, 'F');
      this.pdf.setDrawColor(255, 255, 255, 0.5);
      this.pdf.rect(x, y, maxWidth, maxHeight, 'S');
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(12);
      this.pdf.text('C', x + maxWidth/2, y + maxHeight/2, { align: 'center' });
    }
  }

  // Header with full-width branding
  private addHeader(data: PDFInvoiceData) {
    const { branding } = data;
    const primaryColor = this.hexToRgb(branding.primary_color || '#3B82F6');
    const headerHeight = 80;
    
    // Full-width colored header
    this.pdf.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
    this.pdf.rect(0, 0, this.pageWidth, headerHeight, 'F');
    
    // Company logo (left side)
    if (branding.logo_url) {
      this.addLogo(branding.logo_url, 30, 15, 60, 50);
    }
    
    // Company name and details
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(18);
    const companyName = branding.company_name || 'PayFlow Pro';
    this.pdf.text(companyName, branding.logo_url ? 110 : 30, 35);
    
    // Business contact info
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    let yPos = 50;
    if (branding.business_email) {
      this.pdf.text(branding.business_email, branding.logo_url ? 110 : 30, yPos);
      yPos += 12;
    }
    if (branding.business_phone) {
      this.pdf.text(branding.business_phone, branding.logo_url ? 110 : 30, yPos);
    }
    
    // Invoice title (right side)
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(32);
    this.pdf.text('INVOICE', this.pageWidth - 30, 45, { align: 'right' });
  }

  // Invoice metadata in bordered box
  private addInvoiceMetadata(data: PDFInvoiceData) {
    const { invoice } = data;
    const startY = 100;
    const boxWidth = 180;
    const boxHeight = 80;
    const boxX = this.pageWidth - this.margins.right - boxWidth;
    
    // Border box
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(1);
    this.pdf.rect(boxX, startY, boxWidth, boxHeight);
    
    // Light background
    this.pdf.setFillColor(248, 250, 252);
    this.pdf.rect(boxX, startY, boxWidth, boxHeight, 'F');
    this.pdf.rect(boxX, startY, boxWidth, boxHeight, 'S');
    
    // Content
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(10);
    
    let yPos = startY + 20;
    
    // Invoice Number
    this.pdf.text('Invoice #:', boxX + 15, yPos);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(invoice.invoice_number || invoice.id.slice(0, 8), boxX + 15, yPos + 12);
    
    // Issue Date
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Issue Date:', boxX + 15, yPos + 28);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(new Date().toLocaleDateString('en-US'), boxX + 15, yPos + 40);
    
    // Due Date
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Due Date:', boxX + 15, yPos + 56);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(new Date(invoice.due_date).toLocaleDateString('en-US'), boxX + 15, yPos + 68);
  }

  // Two-column From/Bill To sections
  private addFromAndBillTo(data: PDFInvoiceData) {
    const { invoice, branding } = data;
    const startY = 200;
    const columnWidth = (this.pageWidth - this.margins.left - this.margins.right - 20) / 2;
    const sectionHeight = 100;
    
    // From section (left column)
    this.pdf.setFillColor(248, 250, 252);
    this.pdf.rect(this.margins.left, startY, columnWidth, sectionHeight, 'F');
    this.pdf.setDrawColor(230, 230, 230);
    this.pdf.rect(this.margins.left, startY, columnWidth, sectionHeight, 'S');
    
    const primaryColor = this.hexToRgb(branding.primary_color || '#3B82F6');
    this.pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(12);
    this.pdf.text('FROM:', this.margins.left + 15, startY + 20);
    
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(11);
    this.pdf.text(branding.company_name || 'PayFlow Pro', this.margins.left + 15, startY + 35);
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    let yPos = startY + 48;
    if (branding.business_email) {
      this.pdf.text(branding.business_email, this.margins.left + 15, yPos);
      yPos += 12;
    }
    if (branding.business_phone) {
      this.pdf.text(branding.business_phone, this.margins.left + 15, yPos);
    }
    
    // Bill To section (right column)
    const billToX = this.margins.left + columnWidth + 20;
    this.pdf.setFillColor(248, 250, 252);
    this.pdf.rect(billToX, startY, columnWidth, sectionHeight, 'F');
    this.pdf.setDrawColor(230, 230, 230);
    this.pdf.rect(billToX, startY, columnWidth, sectionHeight, 'S');
    
    this.pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(12);
    this.pdf.text('BILL TO:', billToX + 15, startY + 20);
    
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(11);
    this.pdf.text(invoice.customer_name, billToX + 15, startY + 35);
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    this.pdf.text(invoice.customer_email, billToX + 15, startY + 48);
    
    // Divider line between columns
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.margins.left + columnWidth + 10, startY, this.margins.left + columnWidth + 10, startY + sectionHeight);
  }

  // Professional line items table
  private addLineItemsTable(data: PDFInvoiceData) {
    const { invoice, branding, lineItems } = data;
    const startY = 320;
    const tableWidth = this.pageWidth - this.margins.left - this.margins.right;
    const headerHeight = 30;
    const rowHeight = 25;
    
    const accentColor = this.hexToRgb(branding.accent_color || '#10B981');
    
    // Table header with accent color background
    this.pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b);
    this.pdf.rect(this.margins.left, startY, tableWidth, headerHeight, 'F');
    
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(11);
    
    // Column headers
    this.pdf.text('DESCRIPTION', this.margins.left + 15, startY + 20);
    this.pdf.text('QTY', this.margins.left + tableWidth * 0.7, startY + 20, { align: 'center' });
    this.pdf.text('RATE', this.margins.left + tableWidth * 0.8, startY + 20, { align: 'center' });
    this.pdf.text('AMOUNT', this.margins.left + tableWidth - 15, startY + 20, { align: 'right' });
    
    let currentY = startY + headerHeight;
    
    // Render line items or default item
    const itemsToRender = lineItems && lineItems.length > 0 ? lineItems : [
      {
        description: invoice.description || 'Professional Services',
        quantity: 1,
        rate: parseFloat(invoice.amount),
        amount: parseFloat(invoice.amount)
      }
    ];
    
    itemsToRender.forEach((item, index) => {
      // Alternating row backgrounds
      if (index % 2 === 0) {
        this.pdf.setFillColor(248, 250, 252);
        this.pdf.rect(this.margins.left, currentY, tableWidth, rowHeight, 'F');
      }
      
      // Row borders
      this.pdf.setDrawColor(230, 230, 230);
      this.pdf.rect(this.margins.left, currentY, tableWidth, rowHeight, 'S');
      
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(10);
      
      // Item details
      this.pdf.text(item.description, this.margins.left + 15, currentY + 16);
      this.pdf.text(item.quantity.toString(), this.margins.left + tableWidth * 0.7, currentY + 16, { align: 'center' });
      this.pdf.text(this.formatCurrency(item.rate, invoice.currency), this.margins.left + tableWidth * 0.8, currentY + 16, { align: 'center' });
      
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(this.formatCurrency(item.amount, invoice.currency), this.margins.left + tableWidth - 15, currentY + 16, { align: 'right' });
      
      currentY += rowHeight;
    });
    
    return currentY;
  }

  // Totals summary with highlighted total
  private addTotalsSummary(data: PDFInvoiceData, tableEndY: number) {
    const { branding, subtotal, tax, discount, total } = data;
    const startY = tableEndY + 20;
    const summaryWidth = 220;
    const summaryX = this.pageWidth - this.margins.right - summaryWidth;
    const rowHeight = 18;
    
    const accentColor = this.hexToRgb(branding.accent_color || '#10B981');
    
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    
    let currentY = startY;
    
    // Subtotal
    if (subtotal !== undefined) {
      this.pdf.text('Subtotal:', summaryX, currentY);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(this.formatCurrency(subtotal, data.invoice.currency), summaryX + summaryWidth - 15, currentY, { align: 'right' });
      this.pdf.setTextColor(100, 100, 100);
      this.pdf.setFont('helvetica', 'normal');
      currentY += rowHeight;
    }
    
    // Tax
    if (tax !== undefined && tax > 0) {
      this.pdf.text(`Tax (${data.invoice.invoice_wide_tax_rate || 0}%):`, summaryX, currentY);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(this.formatCurrency(tax, data.invoice.currency), summaryX + summaryWidth - 15, currentY, { align: 'right' });
      this.pdf.setTextColor(100, 100, 100);
      this.pdf.setFont('helvetica', 'normal');
      currentY += rowHeight;
    }
    
    // Discount
    if (discount !== undefined && discount > 0) {
      this.pdf.text('Discount:', summaryX, currentY);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`-${this.formatCurrency(discount, data.invoice.currency)}`, summaryX + summaryWidth - 15, currentY, { align: 'right' });
      this.pdf.setTextColor(100, 100, 100);
      this.pdf.setFont('helvetica', 'normal');
      currentY += rowHeight;
    }
    
    // Total (highlighted with accent color)
    currentY += 5; // Extra spacing before total
    this.pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b);
    this.pdf.rect(summaryX - 15, currentY - 12, summaryWidth + 30, rowHeight + 8, 'F');
    
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(14);
    this.pdf.text('TOTAL:', summaryX, currentY);
    this.pdf.text(this.formatCurrency(total, data.invoice.currency), summaryX + summaryWidth - 15, currentY, { align: 'right' });
    
    return currentY + 30;
  }

  // Payment details and terms
  private addPaymentInformation(data: PDFInvoiceData, startY: number) {
    const { invoice, branding } = data;
    const primaryColor = this.hexToRgb(branding.primary_color || '#3B82F6');
    
    this.pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(14);
    this.pdf.text('PAYMENT INFORMATION', this.margins.left, startY);
    
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    
    let yPos = startY + 20;
    
    // Create a two-column layout for payment info
    const columnWidth = (this.pageWidth - this.margins.left - this.margins.right) / 2;
    
    // Left column - Status
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Status:', this.margins.left, yPos);
    this.pdf.setFont('helvetica', 'normal');
    
    // Status with color coding
    if (invoice.status.toLowerCase() === 'paid') {
      this.pdf.setTextColor(34, 197, 94); // green
    } else if (invoice.status.toLowerCase() === 'pending') {
      this.pdf.setTextColor(234, 179, 8); // yellow
    } else {
      this.pdf.setTextColor(239, 68, 68); // red
    }
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(invoice.status.toUpperCase(), this.margins.left + 40, yPos);
    
    // Right column - Payment URL
    if (invoice.stripe_payment_link_url) {
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Pay Online:', this.margins.left + columnWidth, yPos);
      
      this.pdf.setTextColor(59, 130, 246); // blue
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(8);
      
      // Truncate URL if needed
      let urlText = invoice.stripe_payment_link_url;
      if (urlText.length > 60) {
        urlText = urlText.substring(0, 57) + '...';
      }
      this.pdf.text(urlText, this.margins.left + columnWidth, yPos + 10);
    }
    
    yPos += 30;
    
    // Payment terms in a subtle box
    this.pdf.setFillColor(248, 250, 252);
    this.pdf.rect(this.margins.left, yPos, this.pageWidth - this.margins.left - this.margins.right, 25, 'F');
    this.pdf.setDrawColor(229, 231, 235);
    this.pdf.rect(this.margins.left, yPos, this.pageWidth - this.margins.left - this.margins.right, 25, 'S');
    
    this.pdf.setTextColor(75, 85, 99);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);
    
    const terms = invoice.terms || branding.payment_terms || 'Payment is due within 30 days of invoice date. Late payments may incur additional fees.';
    const termsLines = this.pdf.splitTextToSize(terms, this.pageWidth - this.margins.left - this.margins.right - 20);
    this.pdf.text(termsLines, this.margins.left + 10, yPos + 12);
    
    return yPos + 40;
  }

  // Professional footer
  private addFooter(data: PDFInvoiceData) {
    const { branding } = data;
    const footerY = this.pageHeight - this.margins.bottom + 20;
    
    // Footer line
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.margins.left, footerY - 10, this.pageWidth - this.margins.right, footerY - 10);
    
    // Thank you message
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);
    this.pdf.text(`Thank you for choosing ${branding.company_name || 'PayFlow Pro'}!`, this.margins.left, footerY);
    
    // Page number and company info
    this.pdf.text('Page 1 of 1', this.pageWidth - this.margins.right, footerY, { align: 'right' });
    this.pdf.text(`Generated by ${branding.company_name || 'PayFlow Pro'} \u2022 PayFlow Pro`, this.margins.left, footerY + 12);
    
    if (branding.business_email) {
      this.pdf.text(`Support: ${branding.business_email}`, this.pageWidth - this.margins.right, footerY + 12, { align: 'right' });
    }
  }

  // Main generation method
  public generatePDF(data: PDFInvoiceData): void {
    try {
      // Add all sections
      this.addHeader(data);
      this.addInvoiceMetadata(data);
      this.addFromAndBillTo(data);
      const tableEndY = this.addLineItemsTable(data);
      const totalsEndY = this.addTotalsSummary(data, tableEndY);
      this.addPaymentInformation(data, totalsEndY);
      this.addFooter(data);
      
      // Download the PDF
      const filename = `invoice-${data.invoice.invoice_number || data.invoice.id.slice(0, 8)}.pdf`;
      this.pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  // Get PDF as blob for preview
  public getPDFBlob(data: PDFInvoiceData): Blob {
    this.addHeader(data);
    this.addInvoiceMetadata(data);
    this.addFromAndBillTo(data);
    const tableEndY = this.addLineItemsTable(data);
    const totalsEndY = this.addTotalsSummary(data, tableEndY);
    this.addPaymentInformation(data, totalsEndY);
    this.addFooter(data);
    
    return this.pdf.output('blob');
  }
}

// Helper function to generate professional PDF
export const generateProfessionalInvoicePDF = (
  invoice: InvoiceResponse, 
  branding: BrandingSettingsResponse
): void => {
  const pdfGenerator = new ProfessionalInvoicePDF();
  
  // Parse line items from invoice if they exist
  const lineItems = invoice.line_items ? JSON.parse(invoice.line_items) : [
    {
      description: invoice.description || 'Professional Services',
      quantity: 1,
      rate: parseFloat(invoice.amount),
      amount: parseFloat(invoice.amount)
    }
  ];
  
  // Calculate totals
  const subtotal = lineItems.reduce((sum: number, item: any) => sum + item.amount, 0);
  const taxRate = invoice.invoice_wide_tax_rate || 0;
  const taxAmount = subtotal * (taxRate / 100);
  
  // Calculate discount
  let discountAmount = 0;
  if (invoice.discount_type && invoice.discount_value) {
    if (invoice.discount_type === 'percentage') {
      discountAmount = subtotal * (invoice.discount_value / 100);
    } else {
      discountAmount = invoice.discount_value;
    }
  }
  
  const total = subtotal + taxAmount - discountAmount;
  
  const data: PDFInvoiceData = {
    invoice,
    branding,
    lineItems,
    subtotal,
    tax: taxAmount,
    discount: discountAmount,
    total
  };
  
  pdfGenerator.generatePDF(data);
};
