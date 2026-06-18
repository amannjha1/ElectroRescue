
import React, { useState, useEffect } from 'react';
import { FeedbackItem, UserProfile } from '../types';
import { Star, Clock, User, MessageCircle, Loader2, CheckCircle2, Archive } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';

interface FeedbackPanelProps {
  // Add user prop if needed for permission checks or user context, but for now it's admin-only
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = () => {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'new' | 'reviewed'>('new');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "feedback"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const loadedFeedback: FeedbackItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        loadedFeedback.push({ ...data, id: doc.id });
      });
      setFeedbackItems(loadedFeedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleMarkAsReviewed = async (id: string) => {
    setProcessingId(id);
    try {
      await updateDoc(doc(db, 'feedback', id), { status: 'reviewed' });
      setFeedbackItems(prev => prev.map(item => item.id === id ? { ...item, status: 'reviewed' } : item));
    } catch (error) {
      console.error("Error marking feedback as reviewed:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const displayFeedback = feedbackItems.filter(item => item.status === viewMode);
  const newFeedbackCount = feedbackItems.filter(item => item.status === 'new').length;

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800 mb-6">
        <button
          onClick={() => setViewMode('new')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${viewMode === 'new' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
        >
          New ({newFeedbackCount})
        </button>
        <button
          onClick={() => setViewMode('reviewed')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${viewMode === 'reviewed' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Archive className="w-3 h-3" /> Reviewed
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : displayFeedback.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4 py-10">
          <MessageCircle className="w-8 h-8 opacity-50" />
          <p className="text-sm">No {viewMode} feedback found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayFeedback.map((item) => (
            <div key={item.id} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 transition-colors">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700/30">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold border border-indigo-500/30">
                    {item.userName.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white block">{item.userName}</span>
                    <span className="text-[9px] text-slate-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
                {renderStars(item.rating)}
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="mt-1 shrink-0 opacity-50"><User className="w-3 h-3" /></div>
                  <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg rounded-tl-none border border-slate-800 flex-1">
                    {item.comment || 'No comment provided.'}
                  </p>
                </div>
              </div>

              {item.status === 'new' && (
                <button
                  onClick={() => handleMarkAsReviewed(item.id)}
                  disabled={processingId === item.id}
                  className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50"
                >
                  {processingId === item.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  {processingId === item.id ? 'Marking...' : 'Mark as Reviewed'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackPanel;