
import React, { useState, useEffect } from 'react';
import { ProjectHelpRequest, UserProfile } from '../types';
import { FolderCog, CheckCircle2, XCircle, Clock, User, MessageCircle, Loader2, Send, ChevronLeft, Package } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { sendGeneralEmail } from '../services/emailService';

interface ProjectHelpRequestsPanelProps {
  user: UserProfile;
  isModalView?: boolean;
}

const ProjectHelpRequestsPanel: React.FC<ProjectHelpRequestsPanelProps> = ({ user, isModalView = false }) => {
  const [requests, setRequests] = useState<ProjectHelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'pending' | 'resolved'>('pending');
  
  // State for replying
  const [replyingTo, setReplyingTo] = useState<ProjectHelpRequest | null>(null);
  const [responseText, setResponseText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
        const q = query(collection(db, "project_help_requests"), orderBy("timestamp", "asc"));
        const querySnapshot = await getDocs(q);
        const loadedRequests: ProjectHelpRequest[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as any;
            loadedRequests.push({ ...data, id: doc.id });
        });
        setRequests(loadedRequests);
    } catch (error) { 
        console.error("Error fetching project help requests:", error); 
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { 
    if (user.role === 'Admin') { // Only fetch if user is Admin
      fetchRequests(); 
      setReplyingTo(null);
      setViewMode('pending');
    }
  }, [user]);

  const handleOpenReply = (req: ProjectHelpRequest) => {
      setReplyingTo(req);
      setResponseText('');
  };

  const handleSendReply = async () => {
    if (!replyingTo || !responseText.trim()) return;
    setSendingReply(true);

    try {
        await updateDoc(doc(db, 'project_help_requests', replyingTo.id), { 
            status: 'resolved',
            responseText: responseText
        });
        
        await sendGeneralEmail(
            replyingTo.userEmail,
            `Response to your Project ${replyingTo.type === 'request-project-kit' ? 'Kit Request' : 'Help Query'} - ElectroRescue`,
            `Hello ${replyingTo.userName},\n\nRegarding your project query:\n"${replyingTo.queryText}"\n\nAdmin Response:\n${responseText}\n\nIf you have further questions, you may now raise a new query.`
        );

        setRequests(prev => prev.map(r => r.id === replyingTo.id ? { ...r, status: 'resolved', responseText } : r));
        setReplyingTo(null);
    } catch (e) {
        console.error("Failed to resolve project request:", e);
        alert("Failed to send reply. Please try again.");
    } finally {
        setSendingReply(false);
    }
  };

  const displayRequests = requests.filter(r => r.status === viewMode);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (!user || user.role !== 'Admin') {
    return (
      <div className={`py-10 text-center bg-slate-900/30 rounded-xl border border-dashed border-slate-800 text-slate-500 font-bold uppercase tracking-widest text-xs`}>
        Access Denied: Admin privileges required.
      </div>
    );
  }

  return (
    <div className={`animate-in fade-in duration-500 ${isModalView ? 'px-0 py-0' : 'max-w-7xl mx-auto px-4 md:px-8 py-8'}`}>
      {!isModalView && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <FolderCog className="w-8 h-8 text-blue-500" /> Project Requests
          </h2>
          <p className="text-slate-400 mt-2 text-sm max-w-2xl leading-relaxed">
            Incoming user requests for project ideas or assistance with their projects.
          </p>
        </div>
      )}

      {replyingTo ? (
          <div className="animate-in slide-in-from-right duration-200 flex flex-col h-full">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="font-bold text-white">{replyingTo.userName}</span>
                      <span className="text-xs text-slate-500">({replyingTo.userEmail})</span>
                  </div>
                  {replyingTo.projectTitle && (
                    <div className="mb-2 p-2 bg-slate-950/50 rounded text-xs text-slate-300 border border-slate-800">
                        <span className="font-bold text-slate-500 uppercase tracking-widest block mb-1">Project:</span> {replyingTo.projectTitle}
                    </div>
                  )}
                  {replyingTo.isKitRequest && (
                    <div className="mb-2 p-2 bg-blue-500/10 rounded text-xs text-blue-300 border border-blue-500/20 flex items-center gap-2">
                        <Package className="w-3 h-3" /> <span className="font-bold">Kit Requested:</span> Yes
                    </div>
                  )}
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
                    onClick={() => setViewMode('pending')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${viewMode === 'pending' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Pending ({pendingCount})
                </button>
                <button 
                    onClick={() => setViewMode('resolved')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${viewMode === 'resolved' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    History
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : displayRequests.length === 0 ? (
                <div className={`py-24 text-center rounded-3xl border border-dashed border-slate-800 ${isModalView ? 'bg-slate-900/20' : 'bg-slate-900/30'}`}>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No {viewMode} project requests found.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {displayRequests.map((req) => (
                        <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden group">
                            {/* Status Badge */}
                            <div className="absolute top-4 right-4">
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 uppercase tracking-tighter ${req.status === 'resolved' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-amber-400 border-amber-500/20 bg-amber-500/10'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${req.status === 'resolved' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                                    {req.status}
                                </span>
                            </div>

                            <div className="flex-1 flex flex-col justify-center">
                                <h3 className="text-xl font-bold text-white mb-1">{req.projectTitle || `User Project ${req.type === 'request-project-kit' ? 'Kit Idea' : 'Help'}`}</h3>
                                <p className="text-blue-400/80 text-xs font-medium leading-relaxed mb-4 line-clamp-3 italic opacity-80">
                                   "{req.queryText}"
                                </p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                                        <span className="block text-slate-600 text-[9px] font-bold uppercase tracking-widest mb-1">User</span>
                                        <div className="flex items-center gap-2">
                                          <User className="w-4 h-4 text-slate-500" />
                                          <span className="text-slate-200 font-bold truncate">{req.userName}</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                                        <span className="block text-slate-600 text-[9px] font-bold uppercase tracking-widest mb-1">Type</span>
                                        <div className="flex items-center gap-2">
                                          <MessageCircle className="w-4 h-4 text-slate-500" />
                                          <span className="text-slate-200 font-bold truncate">
                                            {req.type === 'request-project-kit' ? 'Project Kit Request' : 'Project Help'}
                                          </span>
                                        </div>
                                    </div>
                                    {req.isKitRequest && (
                                        <div className="col-span-full bg-blue-950/50 border border-blue-800 rounded-xl p-3 flex items-center gap-2">
                                            <Package className="w-4 h-4 text-blue-500" />
                                            <span className="text-blue-300 font-bold text-sm">WHOLE KIT REQUESTED</span>
                                        </div>
                                    )}
                                </div>

                                {req.responseText && (
                                    <div className="bg-emerald-600/5 p-3 rounded-xl border border-emerald-600/10 mb-4">
                                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest block mb-1">Admin Response</span>
                                        <p className="text-emerald-400/80 text-xs leading-relaxed">{req.responseText}</p>
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                   <span className="text-[10px] text-slate-600 font-mono">Submitted: {new Date(req.timestamp).toLocaleString()}</span>
                                </div>

                                {req.status === 'pending' && (
                                    <div className="flex gap-4 mt-6">
                                        <button 
                                            onClick={() => handleOpenReply(req)} 
                                            disabled={sendingReply}
                                            className="flex-1 bg-blue-600/10 hover:bg-blue-600 disabled:bg-blue-600/10 text-blue-400 hover:text-white disabled:text-blue-400 border border-blue-600/20 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                           {sendingReply ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <MessageCircle className="w-5 h-5" />
                                            )}
                                           {sendingReply ? 'Sending Reply...' : 'Reply & Resolve'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default ProjectHelpRequestsPanel;