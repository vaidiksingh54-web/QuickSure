import React, { useState } from 'react';
import {
  X,
  User,
  MapPin,
  Package,
  FileText,
  ShieldCheck,
  Plus,
  Trash2,
  ExternalLink,
  Printer,
  Calendar,
  CheckCircle2,
  Truck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';

export default function CustomerAccountModal({
  isOpen,
  onClose,
  onOpenTracker,
}) {
  const { user, role } = useAuth();
  const { orders } = useOrders();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'addresses' | 'profile'
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  const [addresses, setAddresses] = useState([
    {
      id: 'addr_1',
      recipient_name: user?.name || 'Aarav Sharma',
      phone: '9876543210',
      street_address: '42 MG Road, Sector 15',
      apartment: 'Tower B, Flat 304',
      city: 'Gurugram',
      state: 'Haryana',
      postal_code: '122001',
      is_default: true,
    },
    {
      id: 'addr_2',
      recipient_name: user?.name || 'Aarav Sharma',
      phone: '9876543210',
      street_address: 'DLF CyberCity, Phase 2, Building 10',
      apartment: 'Floor 7',
      city: 'Gurugram',
      state: 'Haryana',
      postal_code: '122002',
      is_default: false,
    },
  ]);

  if (!isOpen) return null;

  const handleDeleteAddress = (id) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-900 to-indigo-950 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">Customer Account Portal</h2>
              <p className="text-xs text-indigo-200">
                {user?.email || 'Logged in as Customer'} • Role: <strong className="capitalize">{role}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Account Modal"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 flex space-x-6 text-xs font-bold text-gray-600">
          <button
            onClick={() => {
              setActiveTab('orders');
              setSelectedInvoiceOrder(null);
            }}
            className={`py-3 border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'orders' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-gray-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders & Invoices ({orders.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('addresses');
              setSelectedInvoiceOrder(null);
            }}
            className={`py-3 border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'addresses' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-gray-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses ({addresses.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('profile');
              setSelectedInvoiceOrder(null);
            }}
            className={`py-3 border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Profile & Security</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto p-6 flex-1 space-y-4">
          {/* TAB 1: Orders & Invoices */}
          {activeTab === 'orders' && !selectedInvoiceOrder && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Package className="w-12 h-12 text-gray-300 mx-auto" />
                  <h3 className="text-base font-bold text-gray-800">No Orders Placed Yet</h3>
                  <p className="text-xs text-gray-500">
                    Add items to your cart and complete checkout to view live sub-orders and tax invoices.
                  </p>
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 rounded-2xl border border-gray-200 bg-white shadow-xs space-y-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-gray-900">Order #{ord.order_number}</span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                            {ord.status?.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Placed on: {new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onOpenTracker(ord)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Track Packages ({ord.sub_orders?.length || 1})</span>
                        </button>

                        <button
                          onClick={() => setSelectedInvoiceOrder(ord)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-gray-500" />
                          <span>Tax Invoice</span>
                        </button>
                      </div>
                    </div>

                    {/* Order Meta & Amount */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 block">Total Amount</span>
                        <span className="font-extrabold text-gray-900 text-sm">
                          ₹{Number(ord.total_amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Payment Method</span>
                        <span className="font-semibold text-gray-800 uppercase">{ord.payment_method}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Sub-Order Shipments</span>
                        <span className="font-semibold text-indigo-600">{ord.sub_orders?.length || 1} independent parcel(s)</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Recipient</span>
                        <span className="font-semibold text-gray-800 truncate block">
                          {ord.shipping_address?.recipient_name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 1 SUBVIEW: Printable Tax Invoice */}
          {activeTab === 'orders' && selectedInvoiceOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <button
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  &larr; Back to Orders List
                </button>
                <button
                  onClick={handlePrintInvoice}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Tax Invoice</span>
                </button>
              </div>

              {/* Tax Invoice Document Paper */}
              <div className="p-8 bg-white border border-gray-300 rounded-2xl shadow-sm text-xs space-y-6">
                <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">TAX INVOICE</h3>
                    <p className="text-gray-500 text-[11px] mt-0.5">QuickSure Multi-Seller Marketplace</p>
                    <p className="text-gray-400 text-[10px]">GSTIN: 07AABCQ1234F1Z8 | PAN: AABCQ1234F</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800">Invoice #{selectedInvoiceOrder.order_number}</div>
                    <div className="text-gray-500">Date: {new Date(selectedInvoiceOrder.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Billed To / Shipped To */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-bold text-gray-700 block mb-1">Billed & Shipped To:</span>
                    <div className="font-semibold text-gray-900">{selectedInvoiceOrder.shipping_address?.recipient_name}</div>
                    <div className="text-gray-600">{selectedInvoiceOrder.shipping_address?.street_address}</div>
                    <div className="text-gray-600">
                      {selectedInvoiceOrder.shipping_address?.city}, {selectedInvoiceOrder.shipping_address?.state} - {selectedInvoiceOrder.shipping_address?.postal_code}
                    </div>
                    <div className="text-gray-500 mt-1">Phone: {selectedInvoiceOrder.shipping_address?.phone}</div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-bold text-gray-700 block mb-1">Fulfillment Details:</span>
                    <div>Payment Mode: <strong className="uppercase">{selectedInvoiceOrder.payment_method}</strong></div>
                    <div>Status: <strong className="text-emerald-700 uppercase">{selectedInvoiceOrder.status}</strong></div>
                    <div>Packages: <strong>{selectedInvoiceOrder.sub_orders?.length || 1} independent vendor shipment(s)</strong></div>
                  </div>
                </div>

                {/* Items Table with HSN / GST */}
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300 text-gray-700 font-bold bg-gray-50">
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3">HSN/SAC</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Taxable Val</th>
                      <th className="py-2 px-3 text-right">GST Rate</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedInvoiceOrder.sub_orders || []).flatMap((so) => so.order_items || []).map((it, idx) => (
                      <tr key={idx} className="border-b border-gray-100 text-gray-700">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-gray-900">{it.product_title || 'Item'}</div>
                          <div className="text-[10px] text-gray-400">SKU: {it.sku}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-500">85183000</td>
                        <td className="py-2.5 px-3 text-center">{it.quantity}</td>
                        <td className="py-2.5 px-3 text-right">₹{Number(it.price * it.quantity * 0.952).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right">5.0%</td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                          ₹{Number(it.price * it.quantity).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Total Invoice Breakdown */}
                <div className="flex justify-end pt-2">
                  <div className="w-64 space-y-1.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{Number(selectedInvoiceOrder.subtotal_amount || selectedInvoiceOrder.total_amount * 0.952).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CGST (2.5%):</span>
                      <span>₹{Number(selectedInvoiceOrder.tax_amount ? selectedInvoiceOrder.tax_amount / 2 : (selectedInvoiceOrder.total_amount * 0.048) / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST (2.5%):</span>
                      <span>₹{Number(selectedInvoiceOrder.tax_amount ? selectedInvoiceOrder.tax_amount / 2 : (selectedInvoiceOrder.total_amount * 0.048) / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-1 text-sm font-extrabold text-gray-900">
                      <span>Invoice Total:</span>
                      <span>₹{Number(selectedInvoiceOrder.total_amount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-gray-400 border-t border-gray-100 pt-4">
                  This is a computer-generated tax invoice verified under QuickSure E-Commerce Marketplace Regulations.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Saved Addresses */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                        <span>{addr.recipient_name}</span>
                        {addr.is_default && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                            Default Address
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-2 leading-relaxed">
                        {addr.street_address}, {addr.apartment}
                        <br />
                        {addr.city}, {addr.state} - {addr.postal_code}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">📞 {addr.phone}</div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 flex justify-end">
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Profile & Security */}
          {activeTab === 'profile' && (
            <div className="max-w-xl space-y-4 text-xs">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <div className="font-bold text-gray-800">Account Credentials & Role</div>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <div>Email: <strong className="text-gray-900">{user?.email || 'customer@quicksure.com'}</strong></div>
                  <div>Account Role: <strong className="text-indigo-600 uppercase">{role}</strong></div>
                  <div>Status: <strong className="text-emerald-600">Active (Verified)</strong></div>
                  <div>Security: <strong className="text-gray-900">2FA / JWT Bearer</strong></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
