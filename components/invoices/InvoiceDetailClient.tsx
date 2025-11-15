"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Invoice } from '@/types/invoice';
import {
  ArrowLeft,
  Download,
  CreditCard,
  Edit,
  Send,
  Check,
  Clock,
  AlertTriangle,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface InvoiceDetailClientProps {
  invoice: Invoice;
  userRole: 'admin' | 'customer';
  userId: string;
}

export function InvoiceDetailClient({ invoice, userRole, userId }: InvoiceDetailClientProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [editNotes, setEditNotes] = useState(invoice.notes || '');
  const [showEditDialog, setShowEditDialog] = useState(false);

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Paid: 'bg-green-100 text-green-800 border-green-200',
    Overdue: 'bg-red-100 text-red-800 border-red-200',
    Cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const statusIcons = {
    Pending: <Clock className="h-4 w-4" />,
    Paid: <Check className="h-4 w-4" />,
    Overdue: <AlertTriangle className="h-4 w-4" />,
    Cancelled: <X className="h-4 w-4" />,
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  };

  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status === 'Pending';

  const handlePayment = async () => {
    try {
      setIsUpdating(true);

      // Create payment link
      const response = await fetch('/api/payments/create-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment link');
      }

      const { paymentUrl } = await response.json();

      // Redirect to payment page
      window.location.href = paymentUrl;
    } catch (error) {
      console.error('Error initiating payment:', error);
      // You could show an error message to the user here
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotesUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: editNotes }),
      });

      if (response.ok) {
        setShowEditDialog(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Error updating invoice notes:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const lineItems = invoice.lineItems ? JSON.parse(invoice.lineItems) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice #{invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground">
              Created on {format(new Date(invoice.createdAt), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge
            variant="secondary"
            className={`${statusColors[invoice.status as keyof typeof statusColors]} flex items-center space-x-1`}
          >
            {statusIcons[invoice.status as keyof typeof statusIcons]}
            <span>{isOverdue ? 'Overdue' : invoice.status}</span>
          </Badge>

          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>

          {userRole === 'admin' && (
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Notes
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Invoice Notes</DialogTitle>
                  <DialogDescription>
                    Add or update notes for this invoice.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Enter invoice notes..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleNotesUpdate} disabled={isUpdating}>
                      {isUpdating ? 'Saving...' : 'Save Notes'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Invoice Number:</span>
              <span>{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <Badge
                variant="secondary"
                className={statusColors[invoice.status as keyof typeof statusColors]}
              >
                {isOverdue ? 'Overdue' : invoice.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Issue Date:</span>
              <span>{format(new Date(invoice.createdAt), 'MMMM dd, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Due Date:</span>
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                {format(new Date(invoice.dueDate), 'MMMM dd, yyyy')}
              </span>
            </div>
            {invoice.paymentDate && (
              <div className="flex justify-between">
                <span className="font-medium">Payment Date:</span>
                <span>{format(new Date(invoice.paymentDate), 'MMMM dd, yyyy')}</span>
              </div>
            )}
            {invoice.paymentMethod && (
              <div className="flex justify-between">
                <span className="font-medium">Payment Method:</span>
                <span>{invoice.paymentMethod}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parties */}
        <Card>
          <CardHeader>
            <CardTitle>Parties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Customer</h4>
              <p className="font-semibold">{invoice.customer?.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.customer?.email}</p>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Admin</h4>
              <p className="font-semibold">{invoice.admin?.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.admin?.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description and Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          {invoice.description && (
            <CardDescription>{invoice.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {lineItems.length > 0 && (
            <div>
              <h4 className="font-medium mb-4">Line Items</h4>
              <div className="space-y-2">
                {lineItems.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total Amount:</span>
            <span className="text-2xl">{formatCurrency(invoice.amount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {userRole === 'customer' && invoice.status === 'Pending' && (
            <Button onClick={handlePayment} className="w-full">
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Now
            </Button>
          )}

          {userRole === 'admin' && (
            <div className="grid grid-cols-2 gap-4">
              {invoice.status === 'Pending' && (
                <>
                  <Button
                    onClick={() => handleStatusUpdate('Paid')}
                    variant="default"
                    disabled={isUpdating}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate('Cancelled')}
                    variant="outline"
                    disabled={isUpdating}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}
              <Button variant="outline" className="w-full">
                <Send className="mr-2 h-4 w-4" />
                Send Reminder
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}