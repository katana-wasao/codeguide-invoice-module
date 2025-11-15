import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { InvoiceListClient } from '@/components/invoices/InvoiceListClient';

async function getInvoices(session: any) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/invoices`, {
      headers: {
        'Cookie': `better-auth.session_token=${session.sessionToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch invoices');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return { invoices: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
  }
}

export default async function InvoicesPage() {
  const session = await auth.api.getSession({
    headers: { Cookie: `better-auth.session_token=${await getServerSessionToken()}` },
  });

  if (!session?.user) {
    redirect('/sign-in');
  }

  const invoicesData = await getInvoices(session);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
        {session.user.role === 'admin' && (
          <div className="flex items-center space-x-2">
            {/* Create Invoice Button will be added here */}
          </div>
        )}
      </div>

      <Suspense fallback={<div>Loading invoices...</div>}>
        <InvoiceListClient
          initialData={invoicesData}
          userRole={session.user.role}
          userId={session.user.id}
        />
      </Suspense>
    </div>
  );
}

async function getServerSessionToken() {
  // This is a placeholder - in a real implementation, you'd extract the session token
  // from the request cookies or headers
  return '';
}