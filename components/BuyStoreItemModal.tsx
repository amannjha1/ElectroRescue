import React, { useState } from 'react';
import { UserProfile, MarketplaceItem } from '../types';
import { X, Send, ShoppingBag, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { sendGeneralEmail } from '../services/emailService';

interface BuyStoreItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  item: MarketplaceItem;
}

const ADMIN_EMAIL = 'electrorescuehelp@gmail.com';

const BuyStoreItemModal: React.FC<BuyStoreItemModalProps> = ({ isOpen, onClose, user, item }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    contact: '',
    email: user.email || '',
    address: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contact || !formData.email || !formData.address) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const newOrder = {
        id: Date.now().toString(),
        userId: user.id,
        itemId: item.id,
        timestamp: Date.now(),
        type: 'store_item_purchase_request',
        status: 'pending',
        buyerDetails: formData,
        itemDetails: {
          title: item.title,
          price: item.price,
          sellerName: item.sellerName
        }
      };

      await addDoc(collection(db, "store_orders"), newOrder);

      // Notify admin via email
      const emailSubject = `New Store Purchase Request - ${item.title}`;
      const emailBody = `A new store purchase request has been submitted.\n\n` +
        `Item: ${item.title}\n` +
        `Price: ₹${item.price}\n` +
        `Seller: ${item.sellerName || 'Admin'}\n\n` +
        `Buyer Details:\n` +
        `Name: ${formData.name}\n` +
        `Email: ${formData.email}\n` +
        `Contact: ${formData.contact}\n` +
        `Address: ${formData.address}\n\n` +
        `Please coordinate with the buyer.`;

      await sendGeneralEmail(
        ADMIN_EMAIL,
        emailSubject,
        emailBody
      );

      setSubmitStatus('success');
      setTimeout(onClose, 2000);
    } catch (error) {
      console.error("Error submitting store order:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 p-8 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[95vh]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20 text-emerald-500">
               <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white">Request to Buy Item</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <div className="mb-6 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Store Item</p>
            <p className="text-white font-bold mb-1">{item.title}</p>
            <p className="text-emerald-400 font-bold mb-1">₹{item.price}</p>
            <p className="text-xs text-slate-400">Seller: {item.sellerName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Full Name</label>
                   <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none" />
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Contact Number</label>
                   <input required name="contact" value={formData.contact} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none" />
                </div>
            </div>
            <div>
               <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Email Address</label>
               <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none" />
            </div>
            <div>
               <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Shipping Address</label>
               <textarea required name="address" value={formData.address} onChange={handleChange} rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none resize-none" />
            </div>

            {submitStatus === 'success' && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> Request sent successfully!
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> Failed to send request. Try again.
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-4">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Submit Purchase Request
            </button>
        </form>
      </div>
    </div>
  );
};

export default BuyStoreItemModal;
