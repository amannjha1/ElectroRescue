import React, { useState } from 'react';
import { UserProfile } from '../types';
import { X, CheckCircle2, Loader2 } from 'lucide-react';

interface SellProductModalProps {
  user: UserProfile;
  defaultPrice: string;
  pcbCategory: string;
  defaultDescription: string;
  onClose: () => void;
  onSubmit: (title: string, description: string, price: string, contactInfo: string) => Promise<void>;
}

const SellProductModal: React.FC<SellProductModalProps> = ({ user, defaultPrice, pcbCategory, defaultDescription, onClose, onSubmit }) => {
  const [title, setTitle] = useState(`${pcbCategory} - Salvage Lot`);
  const [description, setDescription] = useState(defaultDescription);
  const [price, setPrice] = useState(defaultPrice.replace(/[^0-9]/g, ''));
  const [contactInfo, setContactInfo] = useState(user.email);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(title, description, price, contactInfo);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[95vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white tracking-tight">Sell Product</h2>
          <button onClick={onClose} className="p-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors border border-slate-700/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Item Title</label>
             <input required className="w-full bg-[#0B1120] border border-[#1e293b] rounded-lg p-3 text-white focus:border-emerald-500 outline-none shadow-inner" placeholder="Item Name" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</label>
             <textarea required className="w-full bg-[#0B1120] border border-[#1e293b] rounded-lg p-3 text-white h-24 resize-none focus:border-emerald-500 outline-none shadow-inner" placeholder="Detailed description..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Price (INR)</label>
             <input required type="number" className="w-full bg-[#0B1120] border border-[#1e293b] rounded-lg p-3 text-white focus:border-emerald-500 outline-none shadow-inner" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contact Info (Email/Phone)</label>
             <input required className="w-full bg-[#0B1120] border border-[#1e293b] rounded-lg p-3 text-white focus:border-emerald-500 outline-none shadow-inner" placeholder="Contact Info" value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-[#059669] hover:bg-[#047857] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-2">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Submit Listing Request
          </button>
        </form>
      </div>
    </div>
  );
};

export default SellProductModal;
