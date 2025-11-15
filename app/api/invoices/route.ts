import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { invoice, user } from '@/db/schema';
import { eq, and, desc, like, or } from 'drizzle-orm';
import { z } from 'zod';

const createInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  dueDate: z.string().datetime(),
  description: z.string().optional(),
  lineItems: z.string().optional(), // JSON string
  notes: z.string().optional(),
});

// GET /api/invoices - List invoices (role-based access)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    // Build base query
    let baseQuery = db
      .select({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
        status: invoice.status,
        description: invoice.description,
        paymentDate: invoice.paymentDate,
        paymentMethod: invoice.paymentMethod,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        customer: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        admin: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(invoice)
      .leftJoin(user, eq(invoice.customerId, user.id));

    // Apply role-based filtering
    if (session.user.role === 'customer') {
      baseQuery = baseQuery.where(eq(invoice.customerId, session.user.id));
    }

    // Apply status filter
    if (status) {
      baseQuery = baseQuery.where(and(
        status ? eq(invoice.status, status) : undefined,
        session.user.role === 'customer' ? eq(invoice.customerId, session.user.id) : undefined
      ));
    }

    // Apply search filter
    if (search) {
      baseQuery = baseQuery.where(and(
        or(
          like(invoice.invoiceNumber, `%${search}%`),
          like(invoice.description, `%${search}%`)
        ),
        session.user.role === 'customer' ? eq(invoice.customerId, session.user.id) : undefined
      ));
    }

    const invoices = await baseQuery
      .orderBy(desc(invoice.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    let countQuery = db.select({ count: invoice.id }).from(invoice);

    if (session.user.role === 'customer') {
      countQuery = countQuery.where(eq(invoice.customerId, session.user.id));
    }

    const totalResult = await countQuery;
    const total = totalResult.length;

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create new invoice (admin only)
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = createInvoiceSchema.parse(body);

    // Generate unique invoice ID
    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create invoice
    const [newInvoice] = await db.insert(invoice).values({
      id: invoiceId,
      customerId: validatedData.customerId,
      adminId: session.user.id,
      invoiceNumber: validatedData.invoiceNumber,
      amount: validatedData.amount,
      dueDate: new Date(validatedData.dueDate),
      description: validatedData.description,
      lineItems: validatedData.lineItems,
      notes: validatedData.notes,
      status: 'Pending',
    }).returning();

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);

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