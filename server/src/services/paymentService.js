import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

// In-memory mock payment ledger for test/dev environment
let mockPayments = {};

export const paymentService = {
  /**
   * Simulate a payment transaction
   * Deterministic failure: if amount string ends with '.99', payment fails (for testing)
   * Otherwise, always succeeds.
   */
  simulatePayment: async (orderId, amount, method) => {
    const txnRef = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    const amountStr = String(Number(amount).toFixed(2));
    const isFail = amountStr.endsWith('.99');

    const paymentRecord = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      order_id: orderId,
      transaction_ref: txnRef,
      payment_method: method,
      amount: Number(amount),
      status: isFail ? 'failed' : 'successful',
      raw_payload: {
        gateway: `${method}_simulator`,
        order_id: orderId,
        amount: Number(amount),
        currency: 'INR',
        txn_ref: txnRef,
        timestamp: new Date().toISOString(),
        simulated: true,
        failure_reason: isFail ? 'Simulated payment failure (amount ends in .99)' : null,
      },
      created_at: new Date().toISOString(),
    };

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      mockPayments[paymentRecord.id] = paymentRecord;
      return paymentRecord;
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert({
        order_id: orderId,
        transaction_ref: txnRef,
        payment_method: method,
        amount: Number(amount),
        status: paymentRecord.status,
        raw_payload: paymentRecord.raw_payload,
      })
      .select()
      .single();

    if (error) throw new AppError(`Payment recording failed: ${error.message}`, 500);
    return data;
  },

  /**
   * Simulate a refund for a payment
   */
  simulateRefund: async (paymentId, amount) => {
    const refundRef = `RFN-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const payment = mockPayments[paymentId];
      if (payment) {
        payment.status = 'refunded';
        payment.raw_payload.refund_ref = refundRef;
        payment.raw_payload.refund_amount = amount;
        payment.raw_payload.refund_timestamp = new Date().toISOString();
      }
      return { refund_ref: refundRef, status: 'refunded', amount };
    }

    const { error } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'refunded',
        raw_payload: supabaseAdmin.rpc('jsonb_set', {
          target: 'raw_payload',
          path: '{refund_ref}',
          value: JSON.stringify(refundRef),
        }),
      })
      .eq('id', paymentId);

    if (error) throw new AppError(`Refund recording failed: ${error.message}`, 500);
    return { refund_ref: refundRef, status: 'refunded', amount };
  },

  /**
   * Get payment details by order ID
   */
  getPaymentByOrderId: async (orderId) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      return Object.values(mockPayments).find((p) => p.order_id === orderId) || null;
    }

    const { data } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data || null;
  },

  // Reset mock state (for tests)
  _resetMock: () => {
    mockPayments = {};
  },
};
