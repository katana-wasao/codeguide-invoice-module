import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { invoice, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createPaymentLink } from '@/lib/xendit';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Get invoice details
    const [invoiceRecord] = await db
      .select({
        invoice: invoice,
        customer: user,
      })
      .from(invoice)
      .leftJoin(user, eq(invoice.customerId, user.id))
      .where(eq(invoice.id, invoiceId));

    if (!invoiceRecord) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if the invoice belongs to the current user (customer) or if user is admin
    if (session.user.role !== 'admin' && invoiceRecord.invoice.customerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if invoice is already paid
    if (invoiceRecord.invoice.status === 'Paid') {
      return NextResponse.json(
        { error: 'Invoice is already paid' },
        { status: 400 }
      );
    }

    // Prepare line items
    const lineItems = invoiceRecord.invoice.lineItems
      ? JSON.parse(invoiceRecord.invoice.lineItems)
      : [];

    // Create payment link
    const paymentLink = await createPaymentLink({
      externalId: invoiceId,
      amount: parseFloat(invoiceRecord.invoice.amount as string),
      description: invoiceRecord.invoice.description || `Invoice ${invoiceRecord.invoice.invoiceNumber}`,
      customer: {
        givenNames: invoiceRecord.customer?.name,
        email: invoiceRecord.customer?.email,
      },
      items: lineItems.length > 0
        ? lineItems.map((item: any) => ({
            name: item.description,
            quantity: item.quantity,
            price: item.unitPrice,
          }))
        : [{
            name: invoiceRecord.invoice.description || `Invoice ${invoiceRecord.invoice.invoiceNumber}`,
            quantity: 1,
            price: parseFloat(invoiceRecord.invoice.amount as string),
          }],
      currency: 'USD', // You might want to make this configurable
      shouldSendEmail: false, // We'll send our own emails
      successRedirectUrl: `${process.env.NEXTAUTH_URL}/dashboard/invoices/${invoiceId}?payment=success`,
      failureRedirectUrl: `${process.env.NEXTAUTH_URL}/dashboard/invoices/${invoiceId}?payment=failed`,
      // Set expiry date to 7 days from now
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return NextResponse.json({
      paymentUrl: paymentLink.invoiceUrl,
      paymentLinkId: paymentLink.id,
      expiryDate: paymentLink.expiryDate,
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    );
  }
}