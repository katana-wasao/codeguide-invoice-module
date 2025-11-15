import { xenditClient } from 'xendit-node';

// Initialize Xendit client
const xendit = xenditClient({
  secretKey: process.env.XENDIT_SECRET_KEY!,
});

const { Invoice: XenditInvoice } = xendit;

export interface CreateInvoiceRequest {
  externalId: string;
  amount: number;
  description: string;
  invoiceUrl?: string;
  customer?: {
    givenNames?: string;
    email?: string;
    mobileNumber?: string;
  };
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    url?: string;
  }>;
  fees?: Array<{
    type: string;
    value: number;
  }>;
  currency?: string;
  shouldSendEmail?: boolean;
  tenantId?: string;
  callbackVirtualAccountId?: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  paymentMethods?: string[];
  expiryDate?: Date;
};

export interface PaymentLinkResponse {
  id: string;
  externalId: string;
  userId: string;
  status: string;
  merchantName: string;
  amount: number;
  description: string;
  invoiceUrl: string;
  expiryDate?: string;
  availableBanks?: Array<{
    bankCode: string;
    accountHolderName: string;
    accountNumber: string;
  }>;
  shouldExcludeCreditCard?: boolean;
  shouldSendEmail?: boolean;
  created: string;
  updated: string;
}

/**
 * Create a payment link using Xendit
 */
export async function createPaymentLink(
  request: CreateInvoiceRequest
): Promise<PaymentLinkResponse> {
  try {
    const response = await XenditInvoice.createInvoice({
      data: {
        externalId: request.externalId,
        amount: request.amount,
        description: request.description,
        invoiceUrl: request.invoiceUrl,
        payerEmail: request.customer?.email,
        customer: request.customer,
        items: request.items,
        currency: request.currency || 'IDR',
        shouldSendEmail: request.shouldSendEmail || false,
        successRedirectUrl: request.successRedirectUrl,
        failureRedirectUrl: request.failureRedirectUrl,
        paymentMethods: request.paymentMethods,
        expiryDate: request.expiryDate,
      },
    });

    return {
      id: response.id,
      externalId: response.externalId,
      userId: response.userId,
      status: response.status,
      merchantName: response.merchantName,
      amount: response.amount,
      description: response.description,
      invoiceUrl: response.invoiceUrl,
      expiryDate: response.expiryDate,
      availableBanks: response.availableBanks,
      shouldExcludeCreditCard: response.shouldExcludeCreditCard,
      shouldSendEmail: response.shouldSendEmail,
      created: response.created,
      updated: response.updated,
    };
  } catch (error) {
    console.error('Error creating Xendit payment link:', error);
    throw new Error('Failed to create payment link');
  }
}

/**
 * Get invoice details from Xendit
 */
export async function getInvoice(invoiceId: string): Promise<PaymentLinkResponse> {
  try {
    const response = await XenditInvoice.getInvoiceById({
      invoiceId,
    });

    return {
      id: response.id,
      externalId: response.externalId,
      userId: response.userId,
      status: response.status,
      merchantName: response.merchantName,
      amount: response.amount,
      description: response.description,
      invoiceUrl: response.invoiceUrl,
      expiryDate: response.expiryDate,
      availableBanks: response.availableBanks,
      shouldExcludeCreditCard: response.shouldExcludeCreditCard,
      shouldSendEmail: response.shouldSendEmail,
      created: response.created,
      updated: response.updated,
    };
  } catch (error) {
    console.error('Error fetching Xendit invoice:', error);
    throw new Error('Failed to fetch invoice details');
  }
}

/**
 * Verify webhook signature from Xendit
 */
export function verifyXenditWebhookSignature(
  payload: string,
  signature: string,
  webhookToken: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', webhookToken)
    .update(payload)
    .digest('hex');

  return signature === expectedSignature;
}

/**
 * Parse webhook payload from Xendit
 */
export interface XenditWebhookPayload {
  id: string;
  userId: string;
  externalId: string;
  status: string;
  amount: number;
  description: string;
  paidAt?: string;
  paidAmount?: number;
  paymentChannel?: string;
  paymentDestination?: string;
  paymentMethod?: string;
  created: string;
  updated: string;
  currency?: string;
  fees?: Array<{
    type: string;
    value: number;
  }>;
  metadata?: Record<string, any>;
}

export function parseWebhookPayload(payload: any): XenditWebhookPayload {
  return {
    id: payload.id,
    userId: payload.userId,
    externalId: payload.externalId,
    status: payload.status,
    amount: payload.amount,
    description: payload.description,
    paidAt: payload.paidAt,
    paidAmount: payload.paidAmount,
    paymentChannel: payload.paymentChannel,
    paymentDestination: payload.paymentDestination,
    paymentMethod: payload.paymentMethod,
    created: payload.created,
    updated: payload.updated,
    currency: payload.currency,
    fees: payload.fees,
    metadata: payload.metadata,
  };
}