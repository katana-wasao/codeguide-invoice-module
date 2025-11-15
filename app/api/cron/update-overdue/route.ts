import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { invoice } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';

// Secret key for cron job authentication
const CRON_SECRET = process.env.CRON_SECRET || 'your-cron-secret-key';

/**
 * Update overdue invoices (invoices past due date with 'Pending' status)
 * This endpoint can be called by Vercel Cron Jobs daily
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

    console.log('Starting overdue invoice update job...');

    // Find all pending invoices with due date in the past
    const overdueInvoices = await db
      .select()
      .from(invoice)
      .where(
        and(
          eq(invoice.status, 'Pending'),
          lt(invoice.dueDate, new Date())
        )
      );

    console.log(`Found ${overdueInvoices.length} overdue invoices`);

    if (overdueInvoices.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No overdue invoices found',
        updated: 0,
      });
    }

    // Update all overdue invoices
    let updatedCount = 0;
    for (const invoiceData of overdueInvoices) {
      try {
        await db
          .update(invoice)
          .set({
            status: 'Overdue',
            updatedAt: new Date(),
          })
          .where(eq(invoice.id, invoiceData.id));

        console.log(`Updated invoice ${invoiceData.invoiceNumber} to Overdue`);
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update invoice ${invoiceData.invoiceNumber}:`, error);
      }
    }

    console.log(`Overdue invoice update job completed. Updated ${updatedCount} invoices`);

    return NextResponse.json({
      success: true,
      message: 'Overdue invoice update job completed',
      found: overdueInvoices.length,
      updated: updatedCount,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in overdue invoice update job:', error);
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