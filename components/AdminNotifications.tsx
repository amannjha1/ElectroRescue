

import React, { useEffect, useState } from 'react';
import { HelpRequest } from '../types';
import { X, Bell, CheckCircle2, User, Mail, Clock, Trash2, Loader2, MessageSquare, Send, ChevronLeft, Archive, HelpCircle, Star, FileText } from 'lucide-react'; // Added FileText icon
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { sendGeneralEmail } from '../services/emailService';
import FeedbackPanel from './FeedbackPanel'; // Import the new FeedbackPanel
import FAQManagementPanel from './FAQManagementPanel'; // Import the new FAQManagementPanel

interface AdminNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminNotifications: React.FC<AdminNotificationsProps> = ({ isOpen, onClose }) => {
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  // Updated activeAdminTab state to include 'faqs'
  const [activeAdminTab, setActiveAdminTab] = useState<'help-desk' | 'feedback' | 'faqs'>('help-desk'); 
  const [loadingHelp, setLoadingHelp] = useState(false);
  
  // State for replying to help requests
  const [replyingTo, setReplyingTo] = useState<HelpRequest | null>(null);
  const [responseText, setResponseText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchHelpRequests = async () => {
    setLoadingHelp(true);
    try {
      const q = query(collection(db, 'help_requests'), orderBy('timestamp', 'asc'));
      const snapshot = await getDocs(q);
      const loaded: HelpRequest[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as HelpRequest));
      
      setHelpRequests(loaded);
    } catch (error) {
      console.error("Error fetching help requests", error);
    } finally {
      setLoadingHelp(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHelpRequests();
      setReplyingTo(null);
      // Reset to default tab when opening, or maintain if it's a specific context
      setActiveAdminTab('help-desk'); 
    }
  }, [isOpen]);

  const handleOpenReply = (req: HelpRequest) => {
      setReplyingTo(req);
      setResponseText('');
  };

  const handleSendReply = async () => {
    if (!replyingTo || !responseText.trim()) return;
    setSendingReply(true);

    try {
        await updateDoc(doc(db, 'help_requests', replyingTo.id), { 
            status: 'resolved',
            responseText: responseText
        });
        
        await sendGeneralEmail(
            replyingTo.userEmail,
            "Response to your Help Query - ElectroRescue",
            // Fixed: Corrected typo `replylyingTo` to `replyingTo`
            `Hello ${replyingTo.userName},\n\nRegarding your query:\n"${replyingTo.queryText || 'General Inquiry'}"\n\nAdmin Response:\n${responseText}\n\nIf you have further questions, you may now raise a new query.`
        );

        // Update local state to move item from pending to resolved without refetch
        setHelpRequests(prev => prev.map(r => r.id === replyingTo.id ? { ...r, status: 'resolved', responseText } : r));
        setReplyingTo(null);
    } catch (e) {
        console.error("Failed to resolve", e);
        alert("Failed to send reply. Please try again.");
    } finally {
        setSendingReply(false);
    }
  };

  const pendingHelpCount = helpRequests.filter(r => r.status === 'pending').length;

  if (!isOpen) return null;

  const renderHelpDeskContent = () => {
    const displayRequests = helpRequests.filter(r => r.status === (replyingTo ? 'pending' : 'pending')); // If replyingTo, stay on pending view.
    const resolvedRequests = helpRequests.filter(r => r.status === 'resolved');

    return (
      <div className="flex flex-col h-full">
        {replyingTo ? (
            <div className="animate-in slide-in-from-right duration-200 flex flex-col h-full">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-white">{replyingTo.userName}</span>
                        <span className="text-xs text-slate-500">({replyingTo.userEmail})</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded text-slate-300 text-sm italic border border-slate-800">
                        "{replyingTo.queryText || 'No description provided.'}"
                    </div>
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(replyingTo.timestamp).toLocaleString()}
                    </div>
                </div>

                <div className="flex-1 flex flex-col">
                    <label className="text-sm font-semibold text-slate-400 mb-2">Your Response</label>
                    <textarea 
                        className="w-full flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none placeholder:text-slate-600"
                        placeholder="Type your answer here..."
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                    />
                </div>

                <button 
                    onClick={handleSendReply}
                    disabled={sendingReply || !responseText.trim()}
                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                    {sendingReply ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Send Answer & Resolve
                </button>
            </div>
        ) : (
          <>
              <div className="flex gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800 mb-6">
                  <button 
                    onClick={() => setHelpRequests(helpRequests.filter(r => r.status === 'pending'))} // Temporary filter, ideally use state
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${displayRequests.some(r => r.status === 'pending') ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                      Pending ({pendingHelpCount})
                  </button>
                  <button 
                    onClick={() => setHelpRequests(helpRequests.filter(r => r.status === 'resolved'))} // Temporary filter
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${displayRequests.some(r => r.status === 'resolved') ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                      <Archive className="w-3 h-3" /> History
                  </button>
              </div>

              {loadingHelp ? (
                  <div className="flex justify-center py-10">
                      <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
                  </div>
              ) : displayRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                      <Bell className="w-8 h-8 opacity-50" />
                      <p className="text-sm">No help tickets found for this view.</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                      {displayRequests.map((req) => (
                      <div key={req.id} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 mb-3 hover:border-slate-600 transition-colors">
                          {/* Header */}
                          <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700/30">
                              <div className="flex items-center gap-2">
                                   <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold border border-indigo-500/30">
                                      {req.userName.charAt(0)}
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-xs font-bold text-white block">{req.userName}</span>
                                      <span className="text-[9px] text-slate-500">{new Date(req.timestamp).toLocaleDateString()}</span>
                                   </div>
                              </div>
                              <div className={`text-[10px] px-2 py-0.5 rounded-full border ${req.type === 'admin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                  {req.type === 'admin' ? 'Admin' : 'General'}
                              </div>
                          </div>

                          {/* Q&A Thread */}
                          <div className="space-y-3">
                              {/* Question */}
                              <div className="flex gap-2">
                                  <div className="mt-1 shrink-0 opacity-50"><User className="w-3 h-3" /></div>
                                  <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg rounded-tl-none border border-slate-800 flex-1">
                                      {req.queryText}
                                  </p>
                              </div>
                              
                              {/* Answer (Only if Resolved) */}
                              {req.status === 'resolved' && (
                                   <div className="flex gap-2 flex-row-reverse">
                                      <div className="mt-1 shrink-0 opacity-80"><MessageSquare className="w-3 h-3 text-emerald-400" /></div>
                                      <div className="text-xs text-white bg-emerald-500/10 p-2.5 rounded-lg rounded-tr-none border border-emerald-500/20 flex-1">
                                          {req.responseText}
                                      </div>
                                  </div>
                              )}
                          </div>
                          
                          {/* Actions (Only if Pending) */}
                          {req.status === 'pending' && (
                              <button 
                                  onClick={() => handleOpenReply(req)}
                                  className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                              >
                                  <MessageSquare className="w-3 h-3" /> Reply
                              </button>
                          )}
                      </div>
                      ))}
                  </div>
              )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-slate-900 h-full border-l border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {replyingTo ? (
                    <button onClick={() => setReplyingTo(null)} className="flex items-center gap-2 text-slate-300 hover:text-white">
                        <ChevronLeft className="w-5 h-5" /> Back
                    </button>
                ) : (
                    <>
                        <div className="relative">
                            <Bell className="w-5 h-5 text-amber-400" />
                            {pendingHelpCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>}
                        </div>
                        <h2 className="text-lg font-bold text-white">Admin Hub</h2>
                    </>
                )}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
           </div>
           
           {!replyingTo && (
               <div className="flex gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                   <button 
                     onClick={() => setActiveAdminTab('help-desk')}
                     className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeAdminTab === 'help-desk' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                       <HelpCircle className="w-3 h-3" /> Help Desk
                   </button>
                   <button 
                     onClick={() => setActiveAdminTab('feedback')}
                     className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeAdminTab === 'feedback' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                       <Star className="w-3 h-3" /> Feedback
                   </button>
                   <button 
                     onClick={() => setActiveAdminTab('faqs')}
                     className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeAdminTab === 'faqs' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                       <FileText className="w-3 h-3" /> FAQs
                   </button>
               </div>
           )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
          
          {activeAdminTab === 'help-desk' && renderHelpDeskContent()}
          {activeAdminTab === 'feedback' && <FeedbackPanel />}
          {activeAdminTab === 'faqs' && <FAQManagementPanel />} {/* Render FAQManagementPanel */}

        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;