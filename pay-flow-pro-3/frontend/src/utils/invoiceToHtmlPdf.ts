import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { createRoot } from 'react-dom/client';
import React from 'react';
import InvoiceRenderer from 'components/InvoiceRenderer';
import { InvoiceResponse, BrandingSettingsResponse } from 'types';

// Helper function to convert invoice response to InvoiceRenderer props
const convertInvoiceData = (invoice: InvoiceResponse) => {
  // Parse line items if they exist
  let lineItems = [];
  if (invoice.line_items) {
    try {
      lineItems = JSON.parse(invoice.line_items);
    } catch (e) {
      console.warn('Failed to parse line items:', e);
    }
  }

  return {
    id: invoice.id,
    invoice_number: invoice.invoice_number || invoice.id.slice(0, 8),
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    amount: invoice.amount,
    currency: invoice.currency,
    description: invoice.description,
    customer_name: invoice.customer_name,
    customer_email: invoice.customer_email,
    customer_phone: invoice.customer_phone,
    line_items: lineItems.length > 0 ? lineItems : undefined,
    invoice_wide_tax_rate: invoice.invoice_wide_tax_rate ? parseFloat(invoice.invoice_wide_tax_rate) : undefined,
    discount_type: invoice.discount_type as 'percentage' | 'fixed' | undefined,
    discount_value: invoice.discount_value ? parseFloat(invoice.discount_value) : undefined,
    terms: invoice.terms,
    notes: invoice.notes
  };
};

// Helper function to convert branding response to InvoiceRenderer props
const convertBrandingData = (branding: BrandingSettingsResponse) => {
  return {
    company_name: branding.company_name,
    primary_color: branding.primary_color,
    secondary_color: branding.secondary_color,
    accent_color: branding.accent_color,
    logo_url: branding.logo_url,
    business_email: branding.business_email,
    business_phone: branding.business_phone,
    website_url: branding.website_url,
    payment_terms: branding.payment_terms,
    email_signature: branding.email_signature,
    email_footer_text: branding.email_footer_text
  };
};

// Function to generate PDF from InvoiceRenderer component
export const generateInvoicePDFFromHTML = async (
  invoice: InvoiceResponse,
  branding: BrandingSettingsResponse
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary container for rendering
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.top = '-9999px';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.zIndex = '-1000';
      document.body.appendChild(tempContainer);

      // Convert data to InvoiceRenderer format
      const invoiceData = convertInvoiceData(invoice);
      const brandingData = convertBrandingData(branding);

      // Create React root and render the component
      const root = createRoot(tempContainer);
      
      const InvoiceComponent = React.createElement(InvoiceRenderer, {
        invoice: invoiceData,
        branding: brandingData,
        className: 'w-full',
        isPreview: false
      });

      root.render(InvoiceComponent);

      // Wait for component to render, then capture
      setTimeout(async () => {
        try {
          // Capture the rendered component as canvas
          const canvas = await html2canvas(tempContainer, {
            scale: 2, // Higher resolution
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: tempContainer.scrollWidth,
            height: tempContainer.scrollHeight
          });

          // Create PDF
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          // Calculate dimensions to fit A4
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          // Add image to PDF
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          
          // Generate filename
          const filename = `invoice-${invoiceData.invoice_number}.pdf`;
          
          // Download the PDF
          pdf.save(filename);

          // Cleanup
          root.unmount();
          document.body.removeChild(tempContainer);
          
          resolve();
        } catch (error) {
          console.error('Error capturing or generating PDF:', error);
          // Cleanup on error
          try {
            root.unmount();
            document.body.removeChild(tempContainer);
          } catch (cleanupError) {
            console.warn('Error during cleanup:', cleanupError);
          }
          reject(error);
        }
      }, 1000); // Wait 1 second for rendering to complete
      
    } catch (error) {
      console.error('Error setting up PDF generation:', error);
      reject(error);
    }
  });
};

// Alternative function with better error handling and loading states
export const generateInvoicePDFWithProgress = async (
  invoice: InvoiceResponse,
  branding: BrandingSettingsResponse,
  onProgress?: (step: string) => void
): Promise<void> => {
  onProgress?.('Preparing invoice...');
  
  try {
    await generateInvoicePDFFromHTML(invoice, branding);
    onProgress?.('PDF generated successfully!');
  } catch (error) {
    onProgress?.('Error generating PDF');
    throw error;
  }
};
