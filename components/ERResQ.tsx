
import React, { useState, useEffect } from 'react';
import { MarketplaceItem, UserProfile } from '../types';
import { ShieldAlert, CheckCircle2, XCircle, Clock, ShoppingBag, User, ArrowRight, Loader2 } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
import { sendGeneralEmail } from '../services/emailService';

interface ERResQProps {
  user: UserProfile;
  isModalView?: boolean; // New prop to adjust styling when used in a modal
}

const ERResQ: React.FC<ERResQProps> = ({ user, isModalView = false }) => {
  const [pendingItems, setPendingItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingItemId, setProcessingItemId] = useState<string | null>(null);

  const fetchPendingItems = async () => {
    try {
        const q = query(collection(db, "er_requests"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const loadedItems: MarketplaceItem[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as any;
            loadedItems.push({ ...data, _docId: doc.id });
        });
        setPendingItems(loadedItems);
    } catch (error) { 
        console.error("Fetch error:", error); 
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { fetchPendingItems(); }, []);

  const handleAccept = async (docId: string, item: MarketplaceItem) => {
      if(!window.confirm("Approve this product?")) return;
      setProcessingItemId(docId);
      try {
          await updateDoc(doc(db, "er_requests", docId), { status: 'approved' });
          await sendGeneralEmail(item.contactInfo, "ResQ Update: Approved!", `Your item "${item.title}" has been approved by admin.`);
          fetchPendingItems();
      } catch (error) { alert("Failed to approve."); }
      finally { setProcessingItemId(null); }
  };

  const handleAddToStore = async (docId: string, item: MarketplaceItem) => {
      if(!window.confirm("Add this item to the ResQ Store?")) return;
      setProcessingItemId(docId);
      try {
          await updateDoc(doc(db, "er_requests", docId), { status: 'published' });
          await addDoc(collection(db, "marketplace"), {
              sellerId: item.sellerId, sellerName: item.sellerName, timestamp: Date.now(),
              title: item.title, description: item.description, price: item.price,
              condition: item.condition, contactInfo: item.contactInfo, imageUrl: item.imageUrl || '',
              status: 'approved', stock: 1
          });
          await sendGeneralEmail(item.contactInfo, "ResQ Update: Live in Store!", `Your item "${item.title}" is now LIVE in the ResQ Store.`);
          fetchPendingItems();
      } catch (error) { alert("Failed to add to store."); }
      finally { setProcessingItemId(null); }
  };

  const handleReject = async (docId: string, item: MarketplaceItem) => {
      if(!window.confirm("Reject request?")) return;
      setProcessingItemId(docId);
      try {
          await updateDoc(doc(db, "er_requests", docId), { status: 'rejected' });
          await sendGeneralEmail(item.contactInfo, "ResQ Update: Status", `Your submission "${item.title}" was reviewed and not approved for the marketplace.`);
          fetchPendingItems();
      } catch (error) { alert("Failed."); }
      finally { setProcessingItemId(null); }
  };

  return (
    <div className={`animate-in fade-in duration-500 ${isModalView ? 'px-0 py-0' : 'max-w-7xl mx-auto px-4 md:px-8 py-8'}`}>
      {/* Header matching Screenshot #5 - conditionally rendered based on isModalView */}
      {!isModalView && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-amber-500" /> ER-ResQ Panel
          </h2>
          <p className="text-slate-400 mt-2 text-sm max-w-2xl leading-relaxed">
            Incoming user requests to sell components. These are stored securely for Admin review.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
        </div>
      ) : pendingItems.length === 0 ? (
        <div className={`py-24 text-center rounded-3xl border border-dashed border-slate-800 ${isModalView ? 'bg-slate-900/20' : 'bg-slate-900/30'}`}>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Incoming Queue Empty</p>
        </div>
      ) : (
        /* Card Layout matching Screenshot #5 */
        <div className="space-y-6">
            {pendingItems.map((item) => (
                <div key={(item as any)._docId} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 transition-all relative overflow-hidden group">
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                       <span className={`text-[10px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 uppercase tracking-tighter ${item.status === 'rejected' ? 'text-red-400 border-red-500/20 bg-red-500/10' : item.status === 'published' ? 'text-blue-400 border-blue-500/20 bg-blue-500/10' : item.status === 'approved' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-amber-400 border-amber-500/20 bg-amber-500/10'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'rejected' ? 'bg-red-400' : item.status === 'published' ? 'bg-blue-400' : item.status === 'approved' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                          {item.status === 'published' ? 'in store' : item.status || 'pending'}
                       </span>
                    </div>

                    <div className="w-full md:w-64 h-48 bg-slate-950 rounded-2xl overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center">
                        {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-contain" alt={item.title} /> : <ShoppingBag className="w-12 h-12 text-slate-800" />}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center">
                        <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-blue-400/80 text-xs font-medium leading-relaxed mb-6 line-clamp-3 italic opacity-80">
                           {item.description}
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                                <span className="block text-slate-600 text-[9px] font-bold uppercase tracking-widest mb-1">Fixed Cost (Agreed)</span>
                                <span className="text-emerald-400 text-xl font-bold font-mono">₹{item.price}</span>
                            </div>
                            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                                <span className="block text-slate-600 text-[9px] font-bold uppercase tracking-widest mb-1">Seller</span>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-slate-500" />
                                  <span className="text-slate-200 font-bold truncate">{item.sellerName}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                           <span className="text-[10px] text-slate-600 font-mono">Submitted: {new Date(item.timestamp).toLocaleString()}</span>
                        </div>

                        {(!item.status || item.status === 'pending') && (
                            <div className="flex gap-4 mt-6">
                                <button 
                                    onClick={() => handleAccept((item as any)._docId, item)} 
                                    disabled={processingItemId === (item as any)._docId}
                                    className="flex-1 bg-emerald-600/10 hover:bg-emerald-600 disabled:bg-emerald-600/10 text-emerald-400 hover:text-white disabled:text-emerald-400 border border-emerald-600/20 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                   {processingItemId === (item as any)._docId ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="w-5 h-5" />
                                    )}
                                   {processingItemId === (item as any)._docId ? 'Approving...' : 'Approve Request'}
                                </button>
                                <button 
                                    onClick={() => handleReject((item as any)._docId, item)} 
                                    disabled={processingItemId === (item as any)._docId}
                                    className="px-8 bg-red-600/10 hover:bg-red-600 disabled:bg-red-600/10 text-red-500 hover:text-white disabled:text-red-500 border border-red-500/20 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                   {processingItemId === (item as any)._docId ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <XCircle className="w-5 h-5" />
                                    )}
                                   {processingItemId === (item as any)._docId ? 'Rejecting...' : 'Reject Request'}
                                </button>
                            </div>
                        )}
                        {item.status === 'approved' && (
                            <div className="flex gap-4 mt-6">
                                <button 
                                    onClick={() => handleAddToStore((item as any)._docId, item)} 
                                    disabled={processingItemId === (item as any)._docId}
                                    className="flex-1 bg-blue-600/10 hover:bg-blue-600 disabled:bg-blue-600/10 text-blue-400 hover:text-white disabled:text-blue-400 border border-blue-600/20 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                   {processingItemId === (item as any)._docId ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <ShoppingBag className="w-5 h-5" />
                                    )}
                                   {processingItemId === (item as any)._docId ? 'Adding to Store...' : 'Add Product to Store'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ERResQ;