import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';

async function getCustomers() {
  // In a real implementation, you'd fetch customers from your database
  // For now, returning mock data
  return [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  ];
}

export default async function CreateInvoicePage() {
  const session = await auth.api.getSession({
    headers: { Cookie: `better-auth.session_token=${await getServerSessionToken()}` },
  });

  if (!session?.user) {
    redirect('/sign-in');
  }

  if (session.user.role !== 'admin') {
    redirect('/dashboard/invoices');
  }

  const customers = await getCustomers();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <InvoiceForm
        mode="create"
        customers={customers}
      />
    </div>
  );
}

async function getServerSessionToken() {
  // This is a placeholder - in a real implementation, you'd extract the session token
  // from the request cookies or headers
  return '';
}