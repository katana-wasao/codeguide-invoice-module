import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyXenditWebhookSignature, parseWebhookPayload } from '@/lib/xendit';
import { db } from '@/db';
import { invoice, notification, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendPaymentReceiptEmail } from '@/lib/email';

// Webhook endpoint for Xendit payment notifications
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN!;

    if (!webhookToken) {
      console.error('XENDIT_WEBHOOK_TOKEN not configured');
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      );
    }

    // Get the raw request body
    const rawBody = await request.text();
    const signature = headersList.get('x-callback-token') || '';

    // Verify webhook signature
    if (!verifyXenditWebhookSignature(rawBody, signature, webhookToken)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload = JSON.parse(rawBody);
    const webhookData = parseWebhookPayload(payload);

    console.log('Received Xendit webhook:', webhookData);

    // Handle different webhook events
    if (webhookData.status === 'PAID') {
      await handlePaymentSuccess(webhookData);
    } else if (webhookData.status === 'EXPIRED') {
      await handlePaymentExpired(webhookData);
    } else if (webhookData.status === 'FAILED') {
      await handlePaymentFailed(webhookData);
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error processing Xendit webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(webhookData: any) {
  const { externalId, amount, paidAt, paymentMethod, paymentChannel } = webhookData;

  try {
    // Find the invoice by external ID (we'll use invoice ID as external ID)
    const [invoiceRecord] = await db
      .select({
        invoice: invoice,
        customer: user,
      })
      .from(invoice)
      .leftJoin(user, eq(invoice.customerId, user.id))
      .where(eq(invoice.id, externalId));

    if (!invoiceRecord) {
      console.error('Invoice not found for webhook:', externalId);
      return;
    }

    // Update invoice status
    await db
      .update(invoice)
      .set({
        status: 'Paid',
        paymentDate: paidAt ? new Date(paidAt) : new Date(),
        paymentMethod: `${paymentMethod} - ${paymentChannel}`,
        updatedAt: new Date(),
      })
      .where(eq(invoice.id, externalId));

    // Create notification for customer
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(notification).values({
      id: notificationId,
      userId: invoiceRecord.invoice.customerId,
      type: 'payment_received',
      message: `Payment of ${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)} has been received for invoice ${invoiceRecord.invoice.invoiceNumber}`,
      read: false,
      metadata: JSON.stringify({
        invoiceId: invoiceRecord.invoice.id,
        amount,
        paymentMethod,
        paidAt,
      }),
    });

    // Send payment receipt email
    if (invoiceRecord.customer) {
      try {
        await sendPaymentReceiptEmail({
          to: invoiceRecord.customer.email!,
          customerName: invoiceRecord.customer.name!,
          invoiceNumber: invoiceRecord.invoice.invoiceNumber!,
          amount: parseFloat(invoiceRecord.invoice.amount as string),
          paymentDate: paidAt ? new Date(paidAt) : new Date(),
          paymentMethod: `${paymentMethod} - ${paymentChannel}`,
        });
      } catch (emailError) {
        console.error('Error sending payment receipt email:', emailError);
        // Don't fail the webhook if email fails
      }
    }

    console.log('Successfully processed payment webhook for invoice:', externalId);
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

async function handlePaymentExpired(webhookData: any) {
  const { externalId } = webhookData;

  try {
    // Update invoice status to Overdue
    await db
      .update(invoice)
      .set({
        status: 'Overdue',
        updatedAt: new Date(),
      })
      .where(eq(invoice.id, externalId));

    console.log('Payment expired for invoice:', externalId);
  } catch (error) {
    console.error('Error handling payment expired:', error);
    throw error;
  }
}

async function handlePaymentFailed(webhookData: any) {
  const { externalId } = webhookData;

  try {
    // Update invoice status back to Pending for retry
    await db
      .update(invoice)
      .set({
        status: 'Pending',
        updatedAt: new Date(),
      })
      .where(eq(invoice.id, externalId));

    console.log('Payment failed for invoice:', externalId);
  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}