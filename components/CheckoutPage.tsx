
import React, { useState } from 'react';
import { CartItem, Order } from '../types';
import { processPayment, saveOrder } from '../services/storeService';

interface CheckoutPageProps {
  items: CartItem[];
  total: number;
  onSuccess: (order: Order) => void;
  onCancel: () => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ items, total, onSuccess, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    card: '**** **** **** 4242',
    expiry: '12/26',
    cvc: '123'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const success = await processPayment(total);

    if (success) {
      const newOrder: Order = {
        id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        items: [...items],
        total,
        status: 'completed',
        timestamp: Date.now(),
        customer: {
          name: formData.name,
          email: formData.email
        }
      };
      saveOrder(newOrder);
      onSuccess(newOrder);
    } else {
      alert("Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <button 
        onClick={onCancel}
        className="text-xs uppercase tracking-widest text-gray-400 hover:text-black mb-8 flex items-center gap-2"
      >
        <i className="fas fa-arrow-left"></i> Back to store
      </button>

      <div className="grid md:grid-cols-2 gap-16">
        <div>
          <h2 className="text-2xl font-light uppercase tracking-widest mb-8 text-gray-800 border-b pb-4">Secure Checkout</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Full Name</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Jane Doe"
                className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Email Address</label>
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="jane@example.com"
                className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors"
              />
            </div>
            <div className="pt-6">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Payment Details (Stripe Test)</label>
              <div className="bg-gray-50 p-4 rounded border border-gray-100 space-y-4">
                <div className="flex items-center gap-4">
                  <i className="fab fa-cc-visa text-2xl text-blue-600"></i>
                  <input 
                    readOnly
                    type="text" 
                    value={formData.card}
                    className="bg-transparent flex-1 outline-none text-sm tracking-widest"
                  />
                </div>
                <div className="flex gap-4">
                  <input readOnly value={formData.expiry} className="bg-transparent w-1/2 outline-none text-xs" />
                  <input readOnly value={formData.cvc} className="bg-transparent w-1/2 outline-none text-xs" />
                </div>
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={isProcessing}
              className={`w-full py-5 bg-black text-white text-xs uppercase tracking-[0.3em] font-medium transition-all flex items-center justify-center gap-3 ${isProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-800 active:scale-[0.98]'}`}
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Processing...
                </>
              ) : (
                `Pay $${total.toFixed(2)}`
              )}
            </button>
          </form>
        </div>

        <div className="bg-gray-50/50 p-8">
          <h3 className="text-sm font-medium uppercase tracking-widest mb-6 text-gray-500">Order Summary</h3>
          <div className="space-y-4 mb-8 max-h-64 overflow-y-auto pr-2 no-scrollbar">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{item.name} <span className="text-gray-400 ml-1">x{item.quantity}</span></span>
                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-6 space-y-3">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Shipping</span>
              <span className="text-green-600 uppercase">Complimentary</span>
            </div>
            <div className="flex justify-between text-xl font-light pt-4 border-t border-gray-100">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
