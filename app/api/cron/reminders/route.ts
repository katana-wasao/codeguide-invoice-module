import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { invoice, user } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { sendPaymentReminderEmail } from '@/lib/email';
import { addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

// Secret key for cron job authentication
const CRON_SECRET = process.env.CRON_SECRET || 'your-cron-secret-key';

/**
 * Send payment reminders for invoices due in 3 days
 * This endpoint is called by Vercel Cron Jobs daily at 08:00
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    // Verify the request is from our cron job
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      console.error('Unauthorized cron job attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting payment reminder job...');

    // Calculate the target date (3 days from now)
    const targetDate = addDays(new Date(), 3);
    const targetDateStart = startOfDay(targetDate);
    const targetDateEnd = endOfDay(targetDate);

    console.log(`Looking for invoices due between ${targetDateStart.toISOString()} and ${targetDateEnd.toISOString()}`);

    // Find invoices due in 3 days with 'Pending' status
    const invoicesToRemind = await db
      .select({
        invoice: invoice,
        customer: user,
      })
      .from(invoice)
      .leftJoin(user, eq(invoice.customerId, user.id))
      .where(
        and(
          eq(invoice.status, 'Pending'),
          gte(invoice.dueDate, targetDateStart),
          lte(invoice.dueDate, targetDateEnd)
        )
      );

    console.log(`Found ${invoicesToRemind.length} invoices that need reminders`);

    if (invoicesToRemind.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No invoices require reminders',
        processed: 0,
      });
    }

    let successCount = 0;
    let errorCount = 0;

    // Send reminders for each invoice
    for (const { invoice: invoiceData, customer } of invoicesToRemind) {
      try {
        if (!customer?.email) {
          console.error(`Customer email not found for invoice ${invoiceData.invoiceNumber}`);
          errorCount++;
          continue;
        }

        const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const invoiceUrl = `${baseUrl}/dashboard/invoices/${invoiceData.id}`;

        await sendPaymentReminderEmail({
          to: customer.email,
          customerName: customer.name || 'Valued Customer',
          invoiceNumber: invoiceData.invoiceNumber,
          amount: parseFloat(invoiceData.amount as string),
          dueDate: new Date(invoiceData.dueDate),
          invoiceUrl,
        });

        console.log(`Reminder sent for invoice ${invoiceData.invoiceNumber} to ${customer.email}`);
        successCount++;
      } catch (emailError) {
        console.error(`Failed to send reminder for invoice ${invoiceData.invoiceNumber}:`, emailError);
        errorCount++;
      }
    }

    console.log(`Payment reminder job completed. Success: ${successCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      message: 'Payment reminder job completed',
      processed: invoicesToRemind.length,
      successCount,
      errorCount,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in payment reminder job:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Handle POST requests for testing
 */
export async function POST(request: NextRequest) {
  return GET(request);
}