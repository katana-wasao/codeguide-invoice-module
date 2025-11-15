import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { invoice, user } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateInvoiceSchema = z.object({
  status: z.enum(['Pending', 'Paid', 'Overdue', 'Cancelled']).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().datetime().optional(),
  paymentMethod: z.string().optional(),
});

// GET /api/invoices/[id] - Get invoice details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceId = params.id;

    // Get invoice with customer and admin details
    const [invoiceRecord] = await db
      .select({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
        status: invoice.status,
        description: invoice.description,
        lineItems: invoice.lineItems,
        notes: invoice.notes,
        paymentDate: invoice.paymentDate,
        paymentMethod: invoice.paymentMethod,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        customer: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        admin: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(invoice)
      .leftJoin(user, eq(invoice.customerId, user.id))
      .where(eq(invoice.id, invoiceId));

    if (!invoiceRecord) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check role-based access
    if (session.user.role === 'customer' && invoiceRecord.customer?.id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(invoiceRecord);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/invoices/[id] - Update invoice (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const invoiceId = params.id;
    const body = await request.json();
    const validatedData = updateInvoiceSchema.parse(body);

    // Check if invoice exists
    const [existingInvoice] = await db
      .select()
      .from(invoice)
      .where(eq(invoice.id, invoiceId));

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };

    // Convert date strings to Date objects
    if (validatedData.paymentDate) {
      updateData.paymentDate = new Date(validatedData.paymentDate);
    }

    // Update invoice
    const [updatedInvoice] = await db
      .update(invoice)
      .set(updateData)
      .where(eq(invoice.id, invoiceId))
      .returning();

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id] - Delete invoice (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const invoiceId = params.id;

    // Check if invoice exists
    const [existingInvoice] = await db
      .select()
      .from(invoice)
      .where(eq(invoice.id, invoiceId));

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Don't allow deletion of paid invoices
    if (existingInvoice.status === 'Paid') {
      return NextResponse.json(
        { error: 'Cannot delete paid invoices' },
        { status: 400 }
      );
    }

    // Delete invoice
    await db.delete(invoice).where(eq(invoice.id, invoiceId));

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}