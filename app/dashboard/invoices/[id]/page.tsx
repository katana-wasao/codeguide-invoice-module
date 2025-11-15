import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { InvoiceDetailClient } from '@/components/invoices/InvoiceDetailClient';

async function getInvoice(id: string, session: any) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/invoices/${id}`, {
      headers: {
        'Cookie': `better-auth.session_token=${session.sessionToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch invoice');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth.api.getSession({
    headers: { Cookie: `better-auth.session_token=${await getServerSessionToken()}` },
  });

  if (!session?.user) {
    redirect('/sign-in');
  }

  const invoice = await getInvoice(params.id, session);

  if (!invoice) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Invoice Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The invoice you're looking for doesn't exist or you don't have permission to view it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <InvoiceDetailClient
        invoice={invoice}
        userRole={session.user.role}
        userId={session.user.id}
      />
    </div>
  );
}

async function getServerSessionToken() {
  // This is a placeholder - in a real implementation, you'd extract the session token
  // from the request cookies or headers
  return '';
}