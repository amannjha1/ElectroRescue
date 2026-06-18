import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { UserProfile } from '../types';
import { Loader2, RefreshCw, Package, Clock, CheckCircle2, XCircle, ShoppingBag } from 'lucide-react';

interface MarketplaceItem {
    id: string;
    sellerId: string;
    sellerName: string;
    timestamp: number;
    title: string;
    description: string;
    price: number;
    condition: string;
    contactInfo: string;
    imageUrl?: string;
    status: 'pending' | 'approved' | 'rejected' | 'published';
    _docId?: string;
}

interface MyProductStatusProps {
    user: UserProfile;
}

const MyProductStatus: React.FC<MyProductStatusProps> = ({ user }) => {
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMyItems = async () => {
        setLoading(true);
        try {
            // Note: If you don't have a composite index for sellerId and timestamp(desc), 
            // you might get a Firebase index error. 
            // A safer approach without manual index creation is to query by sellerId and sort locally.
            const q = query(collection(db, "er_requests"), where("sellerId", "==", user.id));
            const querySnapshot = await getDocs(q);
            const loadedItems: MarketplaceItem[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as any;
                loadedItems.push({ ...data, _docId: doc.id });
            });
            loadedItems.sort((a, b) => b.timestamp - a.timestamp);
            setItems(loadedItems);
        } catch (error) {
            console.error("Failed to load your products:", error);
            alert("Failed to load your products.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyItems();
    }, [user.id]);

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Package className="w-8 h-8 text-indigo-400" />
                            My Product Status
                        </h1>
                        <p className="text-slate-400 mt-2">Track the admin approval status of your scanned and submitted products.</p>
                    </div>
                    <button 
                        onClick={fetchMyItems}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors border border-slate-700 self-start md:self-auto"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                        <p className="text-slate-400">Loading your submissions...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700">
                            <Package className="w-10 h-10 text-slate-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Products Submitted</h3>
                        <p className="text-slate-400 max-w-md mx-auto">
                            You haven't submitted any scanned products or parts to the ER-ResQ market yet. 
                            Scan a product from the Analyser Home to get started.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item._docId || item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:border-slate-700 transition-colors">
                                {item.imageUrl ? (
                                    <div className="w-full md:w-48 h-32 md:h-48 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-full md:w-48 h-32 md:h-48 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                                        <Package className="w-8 h-8 text-slate-600" />
                                    </div>
                                )}
                                
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex flex-wrap gap-2 items-start justify-between mb-2">
                                            <h3 className="text-xl font-bold text-white">{item.title}</h3>
                                            
                                            {/* Status Badge */}
                                            {item.status === 'pending' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                    <Clock className="w-3.5 h-3.5" /> Not Approved by Admin Yet
                                                </span>
                                            )}
                                            {item.status === 'approved' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                                </span>
                                            )}
                                            {item.status === 'published' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    <ShoppingBag className="w-3.5 h-3.5" /> Live in Store
                                                </span>
                                            )}
                                            {item.status === 'rejected' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                                    <XCircle className="w-3.5 h-3.5" /> Rejected by TEAM
                                                </span>
                                            )}
                                        </div>
                                        
                                        <p className="text-slate-400 text-sm mb-4 line-clamp-2 md:line-clamp-3">
                                            {item.description}
                                        </p>
                                        
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                                                <span className="text-slate-500 mr-2">Estimated Price:</span>
                                                <span className="text-white font-mono font-medium">₹{item.price}</span>
                                            </div>
                                            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                                                <span className="text-slate-500 mr-2">Condition:</span>
                                                <span className="text-white">{item.condition}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500">
                                        Submitted on: {new Date(item.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyProductStatus;
