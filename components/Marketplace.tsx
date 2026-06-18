
import React, { useState, useEffect } from 'react';
import { MarketplaceItem, UserProfile } from '../types';
import { ShoppingBag, Plus, Tag, X, Settings, Loader2, Trash2, Edit, Package, ClipboardList, CheckCircle2, Mail, ImageIcon, Upload, Send, Calendar, User } from 'lucide-react'; // Added Calendar, User
import { db, storage } from '../services/firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import RequestedProductsModal from './RequestedProductsModal'; 
import BuyStoreItemModal from './BuyStoreItemModal'; // Import BuyStoreItemModal

interface MarketplaceProps {
  user: UserProfile;
  isAdmin?: boolean;
}

const Marketplace: React.FC<MarketplaceProps> = ({ user, isAdmin = false }) => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelling, setIsSelling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBuyerSettings, setShowBuyerSettings] = useState(false);
  const [buyItem, setBuyItem] = useState<MarketplaceItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showRequestedProductsModal, setShowRequestedProductsModal] = useState(false); // New state for modal

  const [newItem, setNewItem] = useState({
    title: '', description: '', price: '', condition: 'Used - Good', contactInfo: user.email, imageUrl: '', stock: '1'
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
        const q = query(collection(db, "marketplace"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const loadedItems: MarketplaceItem[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as any;
            loadedItems.push({ ...data, _docId: doc.id, id: data.id || doc.id });
        });
        setItems(loadedItems);
    } catch (error) { 
        console.error("Error fetching items:", error); 
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewItem(prev => ({ ...prev, imageUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const saveItem = async () => {
    if (!newItem.title.trim() || !newItem.price.trim()) {
        alert("Please enter a title and price.");
        return;
    }
    setIsSubmitting(true);
    try {
        let imageUrl = newItem.imageUrl;
        if (newItem.imageUrl && newItem.imageUrl.startsWith('data:')) {
            const imageRef = ref(storage, `marketplace/${Date.now()}_${user.id}`);
            await uploadString(imageRef, newItem.imageUrl, 'data_url');
            imageUrl = await getDownloadURL(imageRef);
        }
        
        const itemData = {
            sellerId: user.id, 
            sellerName: user.name, 
            timestamp: Date.now(),
            title: newItem.title.trim(), 
            description: newItem.description.trim(), 
            price: newItem.price.replace(/[^0-9]/g, ''),
            condition: newItem.condition, 
            contactInfo: user.email,
            imageUrl: imageUrl || '', 
            status: 'approved' as const, 
            stock: parseInt(newItem.stock) || 1
        };

        if (editingId) {
            await updateDoc(doc(db, "marketplace", editingId), itemData);
        } else {
            await addDoc(collection(db, "marketplace"), { ...itemData, id: Date.now().toString() });
        }

        setIsSelling(false); 
        setEditingId(null);
        setNewItem({ title: '', description: '', price: '', condition: 'Used - Good', contactInfo: user.email, imageUrl: '', stock: '1' });
        await fetchItems();
    } catch (error) { 
        alert("Failed to save item."); 
    } finally { 
        setIsSubmitting(false); 
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-in fade-in duration-500">
      {/* Header matching Screenshot #4 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
            <ShoppingBag className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">ResQ-Store</h2>
            <p className="text-slate-500 text-xs">Admin Control Panel - Manage Marketplace Inventory</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {isAdmin && (
            <>
              <button 
                onClick={() => setShowRequestedProductsModal(true)} // Activate button to open modal
                className="flex-1 md:flex-none px-4 py-2.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
              >
                <ClipboardList className="w-4 h-4" /> Requested_Products
              </button>
              <button 
                onClick={() => { setEditingId(null); setNewItem({ title: '', description: '', price: '', condition: 'Used - Good', contactInfo: user.email, imageUrl: '', stock: '1' }); setIsSelling(true); }}
                className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Inventory
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        /* Empty State matching Screenshot #4 */
        <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
          <div className="mb-6">
            <Package className="w-20 h-20 text-slate-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">ResQ-Store is Empty</h3>
          <p className="text-slate-400">Inventory coming soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all group">
              <div className="h-48 bg-[#1e293b]/50 relative flex flex-col items-center justify-center">
                {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.title} /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-700"><ShoppingBag className="w-12 h-12 mb-2" /><span className="text-sm">Image Hidden (User View)</span></div>}
              </div>
              <div className="p-5">
                 <div className="flex items-center justify-between mb-4 text-slate-400">
                    <div className="flex items-center gap-1.5 text-sm">
                       <Calendar className="w-4 h-4" />
                       <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-200 border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 rounded-md">
                       <Package className="w-3.5 h-3.5" />
                       <span>{item.stock || 1} in Stock</span>
                    </div>
                 </div>

                 <h4 className="text-white font-bold text-xl mb-2 truncate">{item.title}</h4>
                 <p className="text-slate-400 text-sm line-clamp-2 italic">"{item.description}"</p>
                 
                 <hr className="border-slate-800 my-4" />
                 
                 <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-5 h-5 text-emerald-500" />
                    <span className="text-xl font-bold text-slate-300">₹{item.price}</span>
                 </div>

                 <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                       <User className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Seller</span>
                       <span className="text-white font-bold text-sm truncate">{item.sellerName || 'Admin'}</span>
                    </div>
                 </div>

                 {!isAdmin && (
                   <button 
                     onClick={() => setBuyItem(item)} 
                     className="w-full py-3 bg-[#334155] hover:bg-[#475569] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/20"
                   >
                     <ShoppingBag className="w-4 h-4" /> Request to Buy
                   </button>
                 )}

                 {isAdmin && (
                   <div className="flex gap-2 mt-3">
                      <button onClick={() => { 
                        setEditingId((item as any)._docId); 
                        setNewItem({ title: item.title, description: item.description, price: item.price, condition: item.condition, contactInfo: item.contactInfo, imageUrl: item.imageUrl || '', stock: item.stock?.toString() || '1' }); 
                        setIsSelling(true); 
                      }} className="flex-1 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-sm font-bold transition-colors border border-slate-700 flex items-center justify-center gap-1"><Edit className="w-4 h-4" /> Edit</button>
                      <button onClick={() => { if(window.confirm("Delete?")) deleteDoc(doc(db, "marketplace", (item as any)._docId)).then(fetchItems); }} className="flex-1 py-2 bg-slate-800 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-bold transition-colors border border-slate-700 flex items-center justify-center gap-1"><Trash2 className="w-4 h-4" /> Delete</button>
                   </div>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Inventory Modal */}
      {isSelling && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => !isSubmitting && setIsSelling(false)} />
          <div className="relative bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 p-8 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[95vh]">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Inventory' : 'Add Inventory'}</h3>
                <button onClick={() => !isSubmitting && setIsSelling(false)} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
             </div>
             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product Image</label>
                   <div 
                      className="relative h-40 bg-slate-950 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center overflow-hidden transition-all hover:border-blue-500/50 group"
                   >
                      {newItem.imageUrl ? (
                         <div className="w-full h-full relative">
                            <img src={newItem.imageUrl} className="w-full h-full object-contain" alt="Item Preview" />
                            <button onClick={() => setNewItem({...newItem, imageUrl: ''})} className="absolute top-3 right-3 p-2 bg-red-600/90 hover:bg-red-500 text-white rounded-full transition-colors" title="Remove Image"><X className="w-5 h-5" /></button>
                         </div>
                      ) : (
                         <label className="cursor-pointer flex flex-col items-center p-4">
                            <ImageIcon className="w-10 h-10 text-slate-700 group-hover:text-blue-500 transition-colors" />
                            <span className="text-sm text-slate-500 mt-2 font-medium">Upload Product Image</span>
                            <span className="text-xs text-slate-600 mt-0.5">Drag & Drop or Click to Select</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            <button type="button" className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg flex items-center gap-2">
                                <Upload className="w-4 h-4" /> Select Image
                            </button>
                         </label>
                      )}
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Item Title</label>
                       <input className="w-full bg-[#0B1120] border border-[#1e293b] rounded-lg p-3 text-white focus:border-emerald-500 outline-none shadow-inner" placeholder="Item Name" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price (INR)</label>
                           <input className="w-full bg-[#0B1120] border border-[#1e293b] rounded-lg p-3 text-white focus:border-emerald-500 outline-none shadow-inner" placeholder="20" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stock Qty</label>
                           <input className="w-full bg-[#0B1120] border border-[#1e293b] rounded-lg p-3 text-white focus:border-emerald-500 outline-none shadow-inner" placeholder="1" type="number" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})} />
                       </div>
                   </div>
                   <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Condition</label>
                       <select className="w-full bg-[#0B1120] border border-[#1e293b] rounded-lg p-3 text-white focus:border-emerald-500 outline-none shadow-inner appearance-none" value={newItem.condition} onChange={e => setNewItem({...newItem, condition: e.target.value})}>
                           <option value="New">New</option>
                           <option value="Used">Used</option>
                           <option value="Salvaged The Part">Salvaged The Part</option>
                           <option value="Not Working">Not Working</option>
                       </select>
                   </div>
                   <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                       <textarea className="w-full bg-[#0B1120] border border-[#1e293b] rounded-lg p-3 text-white h-24 resize-none focus:border-emerald-500 outline-none shadow-inner" placeholder="Fully functional, minimal scratches..." value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contact Info (Email)</label>
                       <input className="w-full bg-[#0B1120] border border-[#1e293b] rounded-lg p-3 text-white focus:border-emerald-500 outline-none shadow-inner" placeholder="electrorescuehelp@gmail.com" value={newItem.contactInfo} onChange={e => setNewItem({...newItem, contactInfo: e.target.value})} />
                   </div>
                   <button onClick={saveItem} disabled={isSubmitting} className="w-full bg-[#059669] hover:bg-[#047857] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-2">
                     {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                     {editingId ? 'Update Listing' : 'Publish to Store'}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Requested Products Modal */}
      {isAdmin && (
        <RequestedProductsModal 
          isOpen={showRequestedProductsModal}
          onClose={() => setShowRequestedProductsModal(false)}
          user={user}
        />
      )}

      {/* Buy Store Item Modal */}
      {buyItem && (
        <BuyStoreItemModal
          isOpen={!!buyItem}
          onClose={() => setBuyItem(null)}
          user={user}
          item={buyItem}
        />
      )}
    </div>
  );
};

export default Marketplace;