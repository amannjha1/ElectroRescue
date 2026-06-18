
import React, { useState, useEffect } from 'react';
import { FAQItem, UserProfile } from '../types';
import {
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Info,
  Layers,
  Archive,
  BookOpen,
  // Fixed: Added missing ArrowLeft icon import
  ArrowLeft
} from 'lucide-react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

interface FAQManagementPanelProps {
  // Potentially add user prop for more granular permission checks if needed
}

const FAQ_CATEGORIES = [
  'General Usage',
  'Account & Billing',
  'Troubleshooting',
  'Project Help',
  'Marketplace'
];

const FAQManagementPanel: React.FC<FAQManagementPanelProps> = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentCategory, setCurrentCategory] = useState(FAQ_CATEGORIES[0]);
  const [currentOrder, setCurrentOrder] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      // Order by 'order' first, then by 'timestamp' for stability if 'order' is the same
      const q = query(collection(db, "faqs"), orderBy("order", "asc"), orderBy("timestamp", "asc"));
      const snapshot = await getDocs(q);
      // Fixed: Corrected typo 'loadedFqs' to 'loadedFaqs'
      const loadedFaqs = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as FAQItem[];
      setFaqs(loadedFaqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      setSubmitStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const resetForm = () => {
    setCurrentQuestion('');
    setCurrentAnswer('');
    setCurrentCategory(FAQ_CATEGORIES[0]);
    setCurrentOrder(faqs.length > 0 ? Math.max(...faqs.map(f => f.order || 0)) + 1 : 1);
    setSubmitStatus('idle');
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion.trim() || !currentAnswer.trim()) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const newFaq: FAQItem = {
        id: Date.now().toString(), // Firestore will auto-generate, but good for local state
        question: currentQuestion.trim(),
        answer: currentAnswer.trim(),
        category: currentCategory,
        order: currentOrder === 0 ? (faqs.length > 0 ? Math.max(...faqs.map(f => f.order || 0)) + 1 : 1) : currentOrder,
        timestamp: Date.now(),
      };
      await addDoc(collection(db, "faqs"), newFaq);
      setSubmitStatus('success');
      resetForm();
      setViewMode('list');
      await fetchFaqs(); // Re-fetch to update the list and generate new IDs
    } catch (error) {
      console.error("Error adding FAQ:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq || !currentQuestion.trim() || !currentAnswer.trim()) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await updateDoc(doc(db, 'faqs', editingFaq.id), {
        question: currentQuestion.trim(),
        answer: currentAnswer.trim(),
        category: currentCategory,
        order: currentOrder,
      });
      setSubmitStatus('success');
      resetForm();
      setViewMode('list');
      setEditingFaq(null);
      await fetchFaqs();
    } catch (error) {
      console.error("Error updating FAQ:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    setLoading(true); // Temporarily show loading for deletion
    try {
      await deleteDoc(doc(db, 'faqs', id));
      setFaqs(prev => prev.filter(faq => faq.id !== id));
      setSubmitStatus('success');
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      setSubmitStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (faq: FAQItem) => {
    setEditingFaq(faq);
    setCurrentQuestion(faq.question);
    setCurrentAnswer(faq.answer);
    setCurrentCategory(faq.category);
    setCurrentOrder(faq.order);
    setViewMode('edit');
    setSubmitStatus('idle'); // Reset status for edit form
  };

  const handleBackToList = () => {
    setViewMode('list');
    resetForm();
    setEditingFaq(null);
  };

  const maxOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.order || 0)) : 0;
  const minOrder = faqs.length > 0 ? Math.min(...faqs.map(f => f.order || 0)) : 0;

  return (
    <div className="animate-in fade-in duration-500">
      {viewMode !== 'list' && (
        <button
          onClick={handleBackToList}
          className="text-slate-500 hover:text-white flex items-center gap-1 mb-4 text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Back to FAQs
        </button>
      )}

      {viewMode === 'list' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-500" /> FAQ Content
            </h3>
            <button
              onClick={() => { setViewMode('add'); resetForm(); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Add New FAQ
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4 py-10">
              <MessageCircle className="w-8 h-8 opacity-50" />
              <p className="text-sm">No FAQs defined yet. Click "Add New FAQ" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 transition-colors">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700/30">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 text-xs font-bold px-2 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">{faq.category}</span>
                      <span className="text-slate-500 text-xs font-mono">Order: {faq.order}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(faq)}
                        className="p-1.5 text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Edit FAQ"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-white text-base mb-2">{faq.question}</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {(viewMode === 'add' || viewMode === 'edit') && (
        <form onSubmit={viewMode === 'add' ? handleAddFaq : handleUpdateFaq} className="space-y-6 animate-in fade-in duration-300">
          <h3 className="text-xl font-bold text-white mb-4">
            {viewMode === 'add' ? 'Add New FAQ' : `Edit FAQ: ${editingFaq?.question}`}
          </h3>

          {submitStatus === 'success' && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400 text-sm animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              FAQ {viewMode === 'add' ? 'added' : 'updated'} successfully!
            </div>
          )}
          {submitStatus === 'error' && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Failed to {viewMode === 'add' ? 'add' : 'update'} FAQ. Please try again.
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Question</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none mt-2"
              placeholder="What is ElectroRescue.AI?"
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Answer</label>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white h-32 resize-none focus:border-blue-500 outline-none mt-2"
              placeholder="ElectroRescue.AI is an AI-powered platform..."
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none mt-2"
                value={currentCategory}
                onChange={(e) => setCurrentCategory(e.target.value)}
              >
                {FAQ_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Display Order</label>
              <input
                type="number"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none mt-2"
                value={currentOrder}
                onChange={(e) => setCurrentOrder(parseInt(e.target.value))}
                min={1}
                max={faqs.length + 1}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !currentQuestion.trim() || !currentAnswer.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-4"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (viewMode === 'add' ? <Plus className="w-5 h-5" /> : <Edit className="w-5 h-5" />)}
            {isSubmitting ? (viewMode === 'add' ? 'Adding...' : 'Updating...') : (viewMode === 'add' ? 'Add FAQ' : 'Update FAQ')}
          </button>
        </form>
      )}
    </div>
  );
};

export default FAQManagementPanel;
