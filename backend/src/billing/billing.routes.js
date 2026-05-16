// backend/src/billing/billing.routes.js
// Billing module — M-Pesa STK Push + NHIF + Cash payments

import { Router } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { prisma } from '../common/prisma.js';
import { authenticate, authorize } from '../common/guards/jwt.guard.js';
import { validate } from '../common/pipes/validate.js';

export const billingRouter = Router();
billingRouter.use(authenticate);

// ─── M-Pesa Helpers ────────────────────────────────────────────────────────

async function getMpesaToken() {
  const { MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_ENV } = process.env;
  const baseUrl = MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

  const credentials = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  const { data } = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  return { token: data.access_token, baseUrl };
}

function getMpesaPassword() {
  const { MPESA_SHORTCODE, MPESA_PASSKEY } = process.env;
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
  return { password, timestamp };
}

async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count();
  return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
}

async function generatePaymentNumber() {
  const count = await prisma.payment.count();
  return `PAY-${String(count + 1).padStart(6, '0')}`;
}

// ─── GET /api/billing/invoices ─────────────────────────────────────────────

billingRouter.get('/invoices', authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, patientId } = req.query;
    const skip = (page - 1) * Number(limit);

    const where = {
      ...(status && { status }),
      ...(patientId && { patientId }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { firstName: true, lastName: true, patientNumber: true, phone: true } },
          payments: { select: { id: true, amount: true, method: true, status: true, paidAt: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return res.json({ data: invoices, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/billing/invoices/:id ────────────────────────────────────────

billingRouter.get('/invoices/:id', async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true, phone: true, nhifNumber: true } },
        items: true,
        payments: true,
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    return res.json(invoice);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/billing/invoices ───────────────────────────────────────────

const createInvoiceSchema = z.object({
  patientId: z.string(),
  items: z.array(z.object({
    description: z.string(),
    category: z.string(),
    quantity: z.number().min(1).default(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).default(0),
  })),
  discount: z.number().min(0).default(0),
  notes: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

billingRouter.post('/invoices', authorize('ADMIN', 'RECEPTIONIST'), validate(createInvoiceSchema), async (req, res, next) => {
  try {
    const { patientId, items, discount, notes, dueDate } = req.body;

    const subtotal = items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unitPrice - item.discount;
      return sum + lineTotal;
    }, 0);

    const total = subtotal - discount;
    const invoiceNo = await generateInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        patientId,
        subtotal,
        discount,
        tax: 0,
        total,
        balance: total,
        amountPaid: 0,
        status: 'PENDING',
        notes,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        items: {
          create: items.map(item => ({
            ...item,
            total: item.quantity * item.unitPrice - item.discount,
          })),
        },
      },
      include: { items: true, patient: { select: { firstName: true, lastName: true, phone: true } } },
    });

    return res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/billing/pay/mpesa ──────────────────────────────────────────
// Initiates M-Pesa STK Push (same integration pattern as EduPath's fees module)

const mpesaSchema = z.object({
  invoiceId: z.string(),
  phone: z.string().regex(/^254\d{9}$/, 'Phone must be in format 254XXXXXXXXX'),
  amount: z.number().min(1),
});

billingRouter.post('/pay/mpesa', validate(mpesaSchema), async (req, res, next) => {
  try {
    const { invoiceId, phone, amount } = req.body;

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.balance <= 0) return res.status(400).json({ error: 'Invoice already fully paid' });

    const { token, baseUrl } = await getMpesaToken();
    const { password, timestamp } = getMpesaPassword();

    const { data: stkData } = await axios.post(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(amount),
        PartyA: phone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: invoice.invoiceNo,
        TransactionDesc: `Medipath HMS - ${invoice.invoiceNo}`,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Create pending payment record
    const paymentNo = await generatePaymentNumber();
    const payment = await prisma.payment.create({
      data: {
        paymentNo,
        invoiceId,
        amount,
        method: 'MPESA',
        status: 'PENDING',
        mpesaPhone: phone,
        reference: stkData.CheckoutRequestID,
      },
    });

    return res.json({
      message: 'STK Push initiated — check your phone to complete payment',
      checkoutRequestId: stkData.CheckoutRequestID,
      merchantRequestId: stkData.MerchantRequestID,
      paymentId: payment.id,
    });
  } catch (err) {
    if (err.response?.data) {
      return res.status(400).json({ error: 'M-Pesa error', details: err.response.data });
    }
    next(err);
  }
});

// ─── POST /api/billing/mpesa/callback (public, no auth) ───────────────────

billingRouter.post('/mpesa/callback', async (req, res, next) => {
  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = body;

    const payment = await prisma.payment.findFirst({ where: { reference: CheckoutRequestID } });
    if (!payment) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    if (ResultCode === 0) {
      // Payment successful
      const meta = {};
      CallbackMetadata?.Item?.forEach(item => { meta[item.Name] = item.Value; });

      await prisma.$transaction(async (tx) => {
        // Update payment
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            mpesaReceiptNo: meta.MpesaReceiptNumber,
            mpesaAmount: meta.Amount,
            paidAt: new Date(),
          },
        });

        // Update invoice balance
        const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId } });
        const newAmountPaid = invoice.amountPaid + payment.amount;
        const newBalance = invoice.total - newAmountPaid;

        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            amountPaid: newAmountPaid,
            balance: newBalance,
            status: newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID',
          },
        });
      });
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
    }

    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('[M-Pesa Callback Error]', err);
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' }); // Always return 200 to M-Pesa
  }
});

// ─── POST /api/billing/pay/cash ───────────────────────────────────────────

billingRouter.post('/pay/cash', authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const { invoiceId, amount } = req.body;

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const paymentNo = await generatePaymentNumber();

    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          paymentNo,
          invoiceId,
          amount,
          method: 'CASH',
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      });

      const newAmountPaid = invoice.amountPaid + amount;
      const newBalance = invoice.total - newAmountPaid;

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newAmountPaid,
          balance: Math.max(0, newBalance),
          status: newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID',
        },
      });
    });

    return res.json({ message: 'Cash payment recorded successfully' });
  } catch (err) {
    next(err);
  }
});
