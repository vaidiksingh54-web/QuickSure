import React, { useState } from 'react';
import {
  X,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Package,
  Store,
  QrCode
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';

const SAVED_ADDRESSES = [
  {
    id: 'addr_1',
    recipient_name: 'Aarav Sharma',
    phone: '9876543210',
    street_address: '42 MG Road, Sector 15',
    apartment: 'Tower B, Flat 304',
    city: 'Gurugram',
    state: 'Haryana',
    postal_code: '122001',
    country: 'India',
    is_default: true,
  },
  {
    id: 'addr_2',
    recipient_name: 'Aarav Sharma (Office)',
    phone: '9876543210',
    street_address: 'DLF CyberCity, Phase 2, Building 10',
    apartment: 'Floor 7',
    city: 'Gurugram',
    state: 'Haryana',
    postal_code: '122002',
    country: 'India',
    is_default: false,
  },
];

export default function AccordionCheckoutModal({ isOpen, onClose, onOrderSuccess }) {
  const { quote, cart, clearCart, couponCode } = useCart();
  const { checkout, loading } = useOrders();
  const { user } = useAuth();

  // Accordion open section: 1 (Address), 2 (Shipping), 3 (Payment), 4 (Review)
  const [activeStep, setActiveStep] = useState(1);

  // Address state
  const [addresses, setAddresses] = useState(SAVED_ADDRESSES);
  const [selectedAddressId, setSelectedAddressId] = useState('addr_1');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipient_name: '',
    phone: '',
    street_address: '',
    apartment: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
  });

  // Shipping mode state
  const [shippingMode, setShippingMode] = useState('standard'); // 'standard' | 'priority'

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('card_sim'); // 'card_sim' | 'upi_sim' | 'cod_sim'
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4242 •••• •••• 4242',
    cardName: 'Aarav Sharma',
    expiry: '12/28',
    cvv: '888',
    simulationScenario: 'success', // 'success' | 'insufficient_funds' | 'timeout'
  });
  const [upiId, setUpiId] = useState('aarav@okhdfcbank');

  // Error & submission state
  const [checkoutError, setCheckoutError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0];

  const handleAddNewAddress = (e) => {
    e.preventDefault();
    if (!newAddress.recipient_name || !newAddress.phone || !newAddress.street_address || !newAddress.city || !newAddress.postal_code) {
      alert('Please fill all required address fields.');
      return;
    }
    const created = {
      ...newAddress,
      id: `addr_${Date.now()}`,
      is_default: false,
    };
    setAddresses((prev) => [...prev, created]);
    setSelectedAddressId(created.id);
    setShowNewAddressForm(false);
  };

  const handleCompleteCheckout = async () => {
    try {
      setIsSubmitting(true);
      setCheckoutError(null);

      // Verify payment simulation scenario if card
      if (paymentMethod === 'card_sim' && cardDetails.simulationScenario === 'insufficient_funds') {
        throw new Error('Payment Declined: Insufficient funds in simulated account.');
      }
      if (paymentMethod === 'card_sim' && cardDetails.simulationScenario === 'timeout') {
        throw new Error('Payment Gateway Timeout: Simulated banking network delay.');
      }

      const orderPayload = {
        payment_method: paymentMethod,
        shipping_address: {
          recipient_name: currentAddress.recipient_name,
          phone: currentAddress.phone,
          street_address: currentAddress.street_address,
          apartment: currentAddress.apartment || '',
          city: currentAddress.city,
          state: currentAddress.state,
          postal_code: currentAddress.postal_code,
          country: currentAddress.country || 'India',
        },
        coupon_code: couponCode || null,
      };

      const result = await checkout(orderPayload);
      onClose();
      if (onOrderSuccess) onOrderSuccess(result);
    } catch (err) {
      setCheckoutError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group items by seller for review step
  const itemsBySeller = (quote?.items || []).reduce((acc, item) => {
    const seller = item.seller_name || 'QuickSure Verified Merchant';
    if (!acc[seller]) acc[seller] = [];
    acc[seller].push(item);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden relative max-h-[94vh] flex flex-col border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-900 to-indigo-950 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">Express Accordion Checkout</h2>
              <p className="text-xs text-indigo-200">256-bit encrypted multi-seller atomic transaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Checkout"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Accordion Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
          {checkoutError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-700 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* STEP 1: Delivery Address */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden transition-all">
            <button
              onClick={() => setActiveStep(activeStep === 1 ? 0 : 1)}
              className="w-full p-4 bg-gray-50 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentAddress ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  1
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span>Delivery Address</span>
                  </div>
                  {currentAddress && activeStep !== 1 && (
                    <div className="text-xs text-gray-500 truncate max-w-md">
                      Deliver to: {currentAddress.recipient_name}, {currentAddress.street_address}, {currentAddress.city} ({currentAddress.postal_code})
                    </div>
                  )}
                </div>
              </div>
              {activeStep === 1 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {activeStep === 1 && (
              <div className="p-4 space-y-4 bg-white border-t border-gray-100 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAddressId === addr.id
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                        <span>{addr.recipient_name}</span>
                        {addr.is_default && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {addr.street_address}, {addr.apartment}
                        <br />
                        {addr.city}, {addr.state} - {addr.postal_code}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">📞 {addr.phone}</div>
                    </div>
                  ))}
                </div>

                {!showNewAddressForm ? (
                  <button
                    onClick={() => setShowNewAddressForm(true)}
                    className="inline-flex items-center space-x-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Delivery Address</span>
                  </button>
                ) : (
                  <form onSubmit={handleAddNewAddress} className="p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-200">
                    <div className="text-xs font-bold text-gray-800">New Destination Address</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        placeholder="Recipient Full Name"
                        required
                        value={newAddress.recipient_name}
                        onChange={(e) => setNewAddress({ ...newAddress, recipient_name: e.target.value })}
                        className="p-2 border rounded-lg bg-white"
                      />
                      <input
                        type="tel"
                        placeholder="10-digit Phone Number"
                        required
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="p-2 border rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Street Address / House No"
                        required
                        value={newAddress.street_address}
                        onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                        className="p-2 border rounded-lg bg-white col-span-2"
                      />
                      <input
                        type="text"
                        placeholder="Apartment / Landmark"
                        value={newAddress.apartment}
                        onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
                        className="p-2 border rounded-lg bg-white col-span-2"
                      />
                      <input
                        type="text"
                        placeholder="City"
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="p-2 border rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        required
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="p-2 border rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        placeholder="PIN Code"
                        required
                        value={newAddress.postal_code}
                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                        className="p-2 border rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Country"
                        value="India"
                        disabled
                        className="p-2 border rounded-lg bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div className="flex space-x-2 pt-1">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Save & Use Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewAddressForm(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-xs"
                  >
                    Proceed to Shipping Mode &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Shipping Options */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden transition-all">
            <button
              onClick={() => setActiveStep(activeStep === 2 ? 0 : 2)}
              className="w-full p-4 bg-gray-50 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    <span>Shipping Speed</span>
                  </div>
                  {activeStep !== 2 && (
                    <div className="text-xs text-gray-500">
                      {shippingMode === 'standard' ? 'Standard Courier (3-5 Days - Free)' : 'Rush Air Express (1-2 Days - ₹99)'}
                    </div>
                  )}
                </div>
              </div>
              {activeStep === 2 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {activeStep === 2 && (
              <div className="p-4 space-y-3 bg-white border-t border-gray-100 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setShippingMode('standard')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      shippingMode === 'standard' ? 'border-indigo-600 bg-indigo-50/40' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                      <span>Standard Courier</span>
                      <span className="text-emerald-600 font-extrabold">FREE</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Estimated Delivery: 3 to 5 business days via BlueDart / Delhivery Surface.
                    </p>
                  </div>

                  <div
                    onClick={() => setShippingMode('priority')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      shippingMode === 'priority' ? 'border-indigo-600 bg-indigo-50/40' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                      <span>Priority Air Express</span>
                      <span className="text-indigo-600 font-extrabold">+₹99</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Guaranteed Dispatch within 24 hours. Estimated delivery: 1 to 2 business days.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-xs"
                  >
                    Proceed to Payment Method &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Payment Method Simulator */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden transition-all">
            <button
              onClick={() => setActiveStep(activeStep === 3 ? 0 : 3)}
              className="w-full p-4 bg-gray-50 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span>Payment Method Simulator</span>
                  </div>
                  {activeStep !== 3 && (
                    <div className="text-xs text-gray-500">
                      Selected: {paymentMethod === 'card_sim' ? 'Credit/Debit Card' : paymentMethod === 'upi_sim' ? 'Instant UPI' : 'Cash on Delivery'}
                    </div>
                  )}
                </div>
              </div>
              {activeStep === 3 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {activeStep === 3 && (
              <div className="p-4 space-y-4 bg-white border-t border-gray-100 animate-fadeIn">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card_sim')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      paymentMethod === 'card_sim'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                    <span className="text-xs">Credit/Debit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi_sim')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      paymentMethod === 'upi_sim'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <QrCode className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                    <span className="text-xs">Instant UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod_sim')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      paymentMethod === 'cod_sim'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Truck className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                    <span className="text-xs">Cash on Delivery</span>
                  </button>
                </div>

                {/* Card Fields */}
                {paymentMethod === 'card_sim' && (
                  <div className="p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-200 text-xs">
                    <div className="flex items-center justify-between text-gray-700 font-bold">
                      <span>Simulated 256-bit Card Gateway</span>
                      <span className="text-[10px] text-emerald-600">✓ Test Card Preloaded</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={cardDetails.cardNumber}
                        readOnly
                        className="p-2 border rounded-lg bg-white col-span-2 font-mono"
                      />
                      <input
                        type="text"
                        value={cardDetails.cardName}
                        readOnly
                        className="p-2 border rounded-lg bg-white"
                      />
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={cardDetails.expiry}
                          readOnly
                          className="w-1/2 p-2 border rounded-lg bg-white text-center"
                        />
                        <input
                          type="text"
                          value={cardDetails.cvv}
                          readOnly
                          className="w-1/2 p-2 border rounded-lg bg-white text-center font-mono"
                        />
                      </div>
                    </div>

                    {/* Simulation Scenario Selector */}
                    <div className="pt-2 border-t border-gray-200">
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">
                        Developer Verification Scenario:
                      </label>
                      <select
                        value={cardDetails.simulationScenario}
                        onChange={(e) => setCardDetails({ ...cardDetails, simulationScenario: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white text-xs"
                      >
                        <option value="success">Normal Success (HTTP 200 - Transaction Approved)</option>
                        <option value="insufficient_funds">Simulate Insufficient Balance (HTTP 402 Decline)</option>
                        <option value="timeout">Simulate Network Timeout (HTTP 504 Failure)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* UPI Fields */}
                {paymentMethod === 'upi_sim' && (
                  <div className="p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-200 text-xs">
                    <div className="font-bold text-gray-700">Enter Virtual Payment Address (VPA)</div>
                    <input
                      type="text"
                      placeholder="e.g. mobile@upi or username@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full p-2.5 border rounded-lg bg-white font-mono text-xs"
                    />
                    <div className="text-[11px] text-gray-400">
                      ⚡ UPI mandate will be approved automatically via simulated banking webhooks.
                    </div>
                  </div>
                )}

                {/* COD Info */}
                {paymentMethod === 'cod_sim' && (
                  <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-200 text-xs">
                    <div className="font-bold text-gray-800">Cash on Delivery Verification</div>
                    <p className="text-gray-500 text-[11px]">
                      Pay in cash or through QR scan at your doorstep upon parcel delivery. An SMS OTP will be requested upon dispatch.
                    </p>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveStep(4)}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-xs"
                  >
                    Review Multi-Seller Order &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 4: Order Review & Multi-Seller Sub-Order Splitting */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden transition-all">
            <button
              onClick={() => setActiveStep(activeStep === 4 ? 0 : 4)}
              className="w-full p-4 bg-gray-50 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span>Order Review & Multi-Seller Packages</span>
                  </div>
                  {activeStep !== 4 && (
                    <div className="text-xs text-gray-500">
                      Total: ₹{Number(quote?.total || 0).toLocaleString('en-IN')} ({Object.keys(itemsBySeller).length} Seller Shipments)
                    </div>
                  )}
                </div>
              </div>
              {activeStep === 4 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {activeStep === 4 && (
              <div className="p-4 space-y-4 bg-white border-t border-gray-100 animate-fadeIn">
                {/* Multi-Seller Package Breakdown */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                    <Store className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Independent Vendor Packages ({Object.keys(itemsBySeller).length} Sub-Orders)</span>
                  </div>

                  {Object.entries(itemsBySeller).map(([sellerName, items], idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                        <span>Package {idx + 1}: {sellerName}</span>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          Direct Dispatch
                        </span>
                      </div>
                      <div className="space-y-1">
                        {items.map((it, itemIdx) => (
                          <div key={itemIdx} className="flex justify-between text-xs text-gray-600">
                            <span>{it.quantity}x {it.title} ({it.sku})</span>
                            <span className="font-semibold text-gray-900">
                              ₹{Number(it.line_total).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-xs border border-gray-100">
                  <div className="flex justify-between text-gray-600">
                    <span>Items Subtotal:</span>
                    <span>₹{Number(quote?.subtotal || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {quote?.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Promotional Discount:</span>
                      <span>-₹{Number(quote.discount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping Charges:</span>
                    <span>{quote?.shipping_fee === 0 ? 'FREE' : `₹${quote?.shipping_fee}`}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST (5% Authoritative):</span>
                    <span>₹{Number(quote?.tax || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-extrabold text-gray-900">
                    <span>Grand Total:</span>
                    <span>₹{Number(quote?.total || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Final Submit Button */}
                <button
                  disabled={isSubmitting || loading}
                  onClick={handleCompleteCheckout}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-sm shadow-lg shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {isSubmitting ? 'Processing Transaction...' : `Confirm & Pay ₹${Number(quote?.total || 0).toLocaleString('en-IN')}`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
