import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Create transporter
let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransporter(emailConfig);

    // Verify connection configuration
    try {
      await transporter.verify();
      console.log('SMTP server connection verified');
    } catch (error) {
      console.error('Error verifying SMTP connection:', error);
      throw error;
    }
  }
  return transporter;
}

export interface PaymentReminderEmailData {
  to: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: Date;
  invoiceUrl: string;
}

export interface PaymentReceiptEmailData {
  to: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
}

export interface InvoiceCreatedEmailData {
  to: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: Date;
  description?: string;
  invoiceUrl: string;
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminderEmail(data: PaymentReminderEmailData): Promise<void> {
  try {
    const transporter = await getTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Invoice System'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: data.to,
      subject: `Payment Reminder: Invoice ${data.invoiceNumber} Due Soon`,
      html: generatePaymentReminderHTML(data),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Payment reminder email sent to ${data.to} for invoice ${data.invoiceNumber}`);
  } catch (error) {
    console.error('Error sending payment reminder email:', error);
    throw error;
  }
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceiptEmail(data: PaymentReceiptEmailData): Promise<void> {
  try {
    const transporter = await getTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Invoice System'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: data.to,
      subject: `Payment Receipt: Invoice ${data.invoiceNumber}`,
      html: generatePaymentReceiptHTML(data),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Payment receipt email sent to ${data.to} for invoice ${data.invoiceNumber}`);
  } catch (error) {
    console.error('Error sending payment receipt email:', error);
    throw error;
  }
}

/**
 * Send invoice created email
 */
export async function sendInvoiceCreatedEmail(data: InvoiceCreatedEmailData): Promise<void> {
  try {
    const transporter = await getTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Invoice System'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: data.to,
      subject: `New Invoice: ${data.invoiceNumber}`,
      html: generateInvoiceCreatedHTML(data),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Invoice created email sent to ${data.to} for invoice ${data.invoiceNumber}`);
  } catch (error) {
    console.error('Error sending invoice created email:', error);
    throw error;
  }
}

/**
 * Generate HTML for payment reminder email
 */
function generatePaymentReminderHTML(data: PaymentReminderEmailData): string {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(data.amount);

  const formattedDueDate = data.dueDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Reminder</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 10px 10px 0 0;
          text-align: center;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .invoice-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .amount {
          font-size: 24px;
          font-weight: bold;
          color: #e74c3c;
        }
        .cta-button {
          display: inline-block;
          background: #3498db;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          margin-top: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Payment Reminder</h1>
        <p>Your invoice is due in 3 days</p>
      </div>

      <div class="content">
        <p>Hi ${data.customerName},</p>

        <p>This is a friendly reminder that your payment for invoice <strong>${data.invoiceNumber}</strong> is due in 3 days.</p>

        <div class="invoice-details">
          <h3>Invoice Details</h3>
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p><strong>Amount Due:</strong> <span class="amount">${formattedAmount}</span></p>
          <p><strong>Due Date:</strong> ${formattedDueDate}</p>
        </div>

        <p>To avoid any late fees, please make your payment before the due date.</p>

        <div style="text-align: center;">
          <a href="${data.invoiceUrl}" class="cta-button">View & Pay Invoice</a>
        </div>

        <p>If you have any questions or believe this is an error, please contact our support team.</p>

        <p>Thank you for your prompt attention to this matter.</p>
      </div>

      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML for payment receipt email
 */
function generatePaymentReceiptHTML(data: PaymentReceiptEmailData): string {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(data.amount);

  const formattedPaymentDate = data.paymentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
          color: white;
          padding: 30px;
          border-radius: 10px 10px 0 0;
          text-align: center;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .receipt-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .amount {
          font-size: 24px;
          font-weight: bold;
          color: #27ae60;
        }
        .success-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="success-icon">✅</div>
        <h1>Payment Confirmed</h1>
        <p>Thank you for your payment!</p>
      </div>

      <div class="content">
        <p>Hi ${data.customerName},</p>

        <p>We're pleased to confirm that we've received your payment for invoice <strong>${data.invoiceNumber}</strong>.</p>

        <div class="receipt-details">
          <h3>Payment Details</h3>
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p><strong>Amount Paid:</strong> <span class="amount">${formattedAmount}</span></p>
          <p><strong>Payment Date:</strong> ${formattedPaymentDate}</p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
        </div>

        <p>Your invoice has been marked as paid and no further action is required.</p>

        <p>A receipt for this payment has been generated and is available in your dashboard for your records.</p>

        <p>Thank you for your business!</p>
      </div>

      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML for invoice created email
 */
function generateInvoiceCreatedHTML(data: InvoiceCreatedEmailData): string {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(data.amount);

  const formattedDueDate = data.dueDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Invoice</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          color: white;
          padding: 30px;
          border-radius: 10px 10px 0 0;
          text-align: center;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .invoice-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .amount {
          font-size: 24px;
          font-weight: bold;
          color: #3498db;
        }
        .cta-button {
          display: inline-block;
          background: #3498db;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          margin-top: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>New Invoice</h1>
        <p>You have a new invoice to review</p>
      </div>

      <div class="content">
        <p>Hi ${data.customerName},</p>

        <p>A new invoice has been generated and is now available for review.</p>

        <div class="invoice-details">
          <h3>Invoice Details</h3>
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p><strong>Amount Due:</strong> <span class="amount">${formattedAmount}</span></p>
          <p><strong>Due Date:</strong> ${formattedDueDate}</p>
          ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
        </div>

        <p>Please review the invoice and make your payment before the due date to avoid any late fees.</p>

        <div style="text-align: center;">
          <a href="${data.invoiceUrl}" class="cta-button">View & Pay Invoice</a>
        </div>

        <p>If you have any questions about this invoice, please don't hesitate to contact our support team.</p>

        <p>Thank you for your business!</p>
      </div>

      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
}