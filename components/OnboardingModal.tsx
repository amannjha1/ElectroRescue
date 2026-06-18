

import React, { useState, useEffect } from 'react';
import { UserProfile, FeedbackItem, FAQItem } from '../types';
// Fixed: Added missing icon imports Info, Edit, Zap, Users, and Loader2 from lucide-react
// Fixed: Added `Send` icon to imports.
import { Save, User, Lock, Mail, CheckCircle2, AlertCircle, LifeBuoy, Palette, ShieldAlert, KeyRound, Clock, ChevronRight, X, UserCheck, ShieldCheck, Eye, EyeOff, Trash2, HelpCircle, MessageCircle, Info, Edit, Zap, Users, Loader2, Star, Send, Plus, Minus, Upload } from 'lucide-react';
import { doc, updateDoc, setDoc, getDoc, query, collection, where, getDocs, deleteField, addDoc, orderBy } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';

interface OnboardingModalProps {
  user: UserProfile;
  onUpdate: (updatedUser: UserProfile) => void;
  onCancel?: () => void;
  theme: string;
  setTheme: (theme: string) => void;
}

const ADMIN_EMAIL = 'electrorescuehelp@gmail.com';

const THEMES = [
  { id: 'theme-dark', name: 'Dark', color: '#0f172a' },
  { id: 'theme-white', name: 'White', color: '#f8fafc' },
  { id: 'theme-green', name: 'Green', color: '#064e3b' },
  { id: 'theme-cherry', name: 'Cherry', color: '#881337' },
  { id: 'theme-midnight', name: 'Midnight', color: '#000000' }
];

const ALL_TECHNICAL_INTERESTS = [
  'PCB Analysis', 'Embedded Systems', 'VLSI Design', 'Component Recovery',
  'Repair & Diagnostics', 'AI Vision', 'E-Waste Recycling', 'IoT Development',
  'Power Electronics', 'Robotics'
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ user, onUpdate, onCancel, theme, setTheme }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'security' | 'helpdesk' | 'feedback'>('profile');
  const isAdmin = user.email === ADMIN_EMAIL || user.role === 'Admin';
  const [isEditingProfile, setIsEditingProfile] = useState(false); // New state to toggle edit mode
  
  const [showHelpForm, setShowHelpForm] = useState(false);
  const [helpQuery, setHelpQuery] = useState('');
  const [isSubmittingHelp, setIsSubmittingHelp] = useState(false);
  const [helpsUsed, setHelpsUsed] = useState(0);

  useEffect(() => {
    const sessionKey = `helps_used_${user.id}`;
    const storedCount = sessionStorage.getItem(sessionKey);
    if (storedCount) {
      setHelpsUsed(parseInt(storedCount, 10));
    }
  }, [user.id]);

  const [formData, setFormData] = useState({
    name: user.name || '',
    age: user.age || '',
    university: user.university || '',
    domain: user.domain || '',
    role: user.role || 'Student',
    technicalInterests: user.technicalInterests || [], // Changed to array
    usageContext: user.usageContext || 'Learning',
    engineeringSummary: user.engineeringSummary || ''
  });

  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [passStatus, setPassStatus] = useState({ type: '', text: '' });

  const [masterKey, setMasterKey] = useState('');
  const [loginKey, setLoginKey] = useState(user.loginKey || '');
  const [keyStatus, setKeyStatus] = useState('');
  const [adminTeam, setAdminTeam] = useState<UserProfile[]>([]);

  const [helpHistory, setHelpHistory] = useState<any[]>([]);
  const [loadingHelp, setLoadingHelp] = useState(false);

  // Feedback states
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const APP_VERSION = 'v1.2.4-beta'; // Define app version for feedback

  // FAQ states
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [isUploadingAppLogo, setIsUploadingAppLogo] = useState(false);

  const handleAppLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAppLogo(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        const storageRef = ref(storage, `app/logo_${Date.now()}`);
        await uploadString(storageRef, base64String, 'data_url');
        const downloadUrl = await getDownloadURL(storageRef);

        await setDoc(doc(db, 'app_settings', 'global'), { logoUrl: downloadUrl }, { merge: true });
        alert('App Logo updated successfully!');
      } catch (error) {
        console.error("Error uploading app logo:", error);
        alert('Failed to upload app logo.');
      } finally {
        setIsUploadingAppLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        const storageRef = ref(storage, `profiles/${user.id}_${Date.now()}`);
        await uploadString(storageRef, base64String, 'data_url');
        const url = await getDownloadURL(storageRef);
        onUpdate({ ...user, profileImageUrl: url });
      } catch (err) {
        console.error("Failed to upload image", err);
      } finally {
        setIsUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (activeTab === 'security' && isAdmin) fetchAdminTeam();
    if (activeTab === 'helpdesk') {
        fetchHelpHistory();
        fetchFaqs(); // Fetch FAQs when helpdesk tab is active
    }
  }, [activeTab, isAdmin]);

  const fetchAdminTeam = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "Admin"));
      const snap = await getDocs(q);
      const admins = snap.docs.map(d => d.data() as UserProfile).filter(a => a.email !== ADMIN_EMAIL);
      setAdminTeam(admins);
    } catch (e) { console.error(e); }
  };

  const fetchHelpHistory = async () => {
    setLoadingHelp(true);
    try {
      const q = query(collection(db, "help_requests"), where("userId", "==", user.id));
      const snap = await getDocs(q);
      setHelpHistory(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    } catch (e) { console.error(e); } finally { setLoadingHelp(false); }
  };

  const fetchFaqs = async () => {
    setLoadingFaqs(true);
    try {
      const q = query(collection(db, "faqs"), orderBy("order", "asc"), orderBy("timestamp", "asc"));
      const snap = await getDocs(q);
      const loadedFaqs = snap.docs.map(d => ({ ...d.data(), id: d.id })) as FAQItem[];
      setFaqs(loadedFaqs);
    } catch (e) {
      console.error("Error fetching FAQs:", e);
    } finally {
      setLoadingFaqs(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: UserProfile = { 
      ...user, 
      name: formData.name,
      age: formData.age,
      university: formData.university,
      domain: formData.domain,
      role: formData.role,
      engineeringSummary: formData.engineeringSummary,
      technicalInterests: formData.technicalInterests, // Now directly an array
      usageContext: formData.usageContext,
    };
    onUpdate(updatedUser);
    setIsEditingProfile(false); // Exit edit mode after update
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) { setPassStatus({ type: 'error', text: 'Mismatch' }); return; }
    try {
      await updateDoc(doc(db, "users", user.email), { password: passData.new });
      setPassStatus({ type: 'success', text: 'Password Updated' });
      setPassData({ current: '', new: '', confirm: '' });
    } catch (e) { setPassStatus({ type: 'error', text: 'Failed' }); }
  };

  const handleUpdateLoginKey = async () => {
    try {
      await updateDoc(doc(db, "users", user.email), { loginKey: loginKey });
      onUpdate({ ...user, loginKey });
      setKeyStatus('Login Key Saved!');
    } catch (e) { setKeyStatus('Failed'); }
  };

  const handleUpdateMasterKey = async () => {
    try {
      await setDoc(doc(db, 'system_config', 'admin_settings'), { masterKey, updatedAt: Date.now() }, { merge: true });
      setKeyStatus('Master Key Updated!');
    } catch (e) { setKeyStatus('Failed'); }
  };

  const handleToggleInterest = (interest: string) => {
    setFormData(prev => {
      const currentInterests = prev.technicalInterests;
      if (currentInterests.includes(interest)) {
        return { ...prev, technicalInterests: currentInterests.filter(i => i !== interest) };
      } else if (currentInterests.length < 5) { // Max 5 interests
        return { ...prev, technicalInterests: [...currentInterests, interest] };
      }
      return prev;
    });
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackRating === 0 && !feedbackComment.trim()) {
      setFeedbackStatus('error');
      return;
    }
    setFeedbackStatus('idle');
    try {
      const newFeedback: FeedbackItem = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        rating: feedbackRating,
        comment: feedbackComment.trim(),
        timestamp: Date.now(),
        status: 'new',
        appVersion: APP_VERSION,
      };
      await addDoc(collection(db, "feedback"), newFeedback);
      setFeedbackStatus('success');
      setFeedbackRating(0);
      setFeedbackComment('');
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setFeedbackStatus('error');
    }
  };

  const handleSubmitHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpQuery.trim() || helpsUsed >= 2) return;

    setIsSubmittingHelp(true);
    try {
      const newHelp = {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        queryText: helpQuery.trim(),
        timestamp: Date.now(),
        status: 'pending',
        type: 'admin'
      };
      const docRef = await addDoc(collection(db, "help_requests"), newHelp);
      
      const newCount = helpsUsed + 1;
      setHelpsUsed(newCount);
      sessionStorage.setItem(`helps_used_${user.id}`, newCount.toString());

      setHelpHistory(prev => [{ ...newHelp, id: docRef.id }, ...prev]);
      setHelpQuery('');
      setShowHelpForm(false);
    } catch (err) {
      console.error("Error submitting help:", err);
    } finally {
      setIsSubmittingHelp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onCancel} />
      
      {/* Settings Dialog Structure */}
      <div className="relative bg-slate-950/60 backdrop-blur-3xl w-full max-w-4xl h-[90vh] md:h-[650px] rounded-2xl border border-slate-800 shadow-3xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-800 p-4 md:p-8 shrink-0 flex flex-col">
          <div className="mb-4 md:mb-10 flex justify-between items-center md:block">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Settings</h2>
              <p className="text-slate-500 text-xs mt-1 hidden md:block">Manage your account</p>
            </div>
            <button onClick={onCancel} className="md:hidden flex items-center gap-2 p-2 bg-slate-800 rounded-lg text-slate-400">
               <X className="w-4 h-4"/>
            </button>
          </div>
          
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {[
              { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4 shrink-0" /> },
              { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4 shrink-0" /> },
              { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4 shrink-0" /> },
              { id: 'helpdesk', label: 'Helpdesk', icon: <HelpCircle className="w-4 h-4 shrink-0" /> },
              { id: 'feedback', label: 'Feedback', icon: <MessageCircle className="w-4 h-4 shrink-0" /> },
              ...(isAdmin ? [{ id: 'adminSettings', label: 'Admin Settings', icon: <KeyRound className="w-4 h-4 shrink-0" /> }] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setIsEditingProfile(false); }} // Reset edit mode when changing tabs
                className={`flex items-center gap-3 px-4 py-2.5 md:py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          
          <button onClick={onCancel} className="hidden md:flex mt-auto items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold">
            <X className="w-4 h-4" /> Close Settings
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 md:p-10 overflow-y-auto custom-scrollbar relative">
          
          {/* TABS CONTENT */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
              {isEditingProfile ? (
                // --- PROFILE EDIT FORM ---
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-6">Edit Profile</h3>
                  
                  <div className="flex flex-col items-center sm:items-start mb-6">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Profile Picture</label>
                    <label className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-800/50 shadow-inner group cursor-pointer relative overflow-hidden">
                       {user.profileImageUrl ? (
                         <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                       ) : (
                         <User className="w-10 h-10 text-slate-500" />
                       )}
                       <div className="absolute inset-0 bg-slate-950/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity flex-col gap-1">
                          {isUploadingImage ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Edit className="w-6 h-6 text-white" />}
                       </div>
                       <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                      <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Age</label>
                      <input type="text" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" placeholder="e.g., 20" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">University / Organization</label>
                      <input type="text" value={formData.university} onChange={e => setFormData({...formData, university: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Primary Focus / Domain</label>
                      <input type="text" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Role</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none">
                      <option value="Student">Student</option>
                      <option value="Hobbyist">Hobbyist</option>
                      <option value="Engineer">Engineer</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Engineering Summary</label>
                    <textarea value={formData.engineeringSummary} onChange={e => setFormData({...formData, engineeringSummary: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white h-24 resize-none focus:border-blue-500 outline-none" placeholder="Briefly describe your technical focus or goals (e.g., Focused on PCB failure analysis...)" />
                  </div>

                  {/* USAGE CONTEXT (AI ENHANCEMENT) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">USAGE CONTEXT (AI ENHANCEMENT)</label>
                    <select 
                      value={formData.usageContext} 
                      onChange={e => setFormData({...formData, usageContext: e.target.value})} 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                    >
                      <option value="Learning">Learning</option>
                      <option value="Research">Research</option>
                      <option value="Professional">Professional</option>
                      <option value="Hobby">Hobby</option>
                      <option value="Experimentation">Experimentation</option>
                      <option value="Other">Other</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">This field is used for system personalization and is not public.</p>
                  </div>

                  {/* TECHNICAL INTERESTS */}
                  <div className="space-y-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-3 h-3 text-slate-500" /> Technical Interests
                      </label>
                      <span className="text-xs text-slate-500">{formData.technicalInterests.length}/5 selected</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ALL_TECHNICAL_INTERESTS.map(interest => {
                        const isSelected = formData.technicalInterests.includes(interest);
                        const isDisabled = !isSelected && formData.technicalInterests.length >= 5;
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => handleToggleInterest(interest)}
                            disabled={isDisabled}
                            className={`
                              px-4 py-2 rounded-full text-sm font-medium transition-colors border
                              ${isSelected 
                                ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500' 
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              }
                              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                          >
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                      <Save className="w-5 h-5" /> Save Changes
                    </button>
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                // --- PROFILE VIEW PANEL (MATCHING SCREENSHOT) ---
                <>
                  <div className="bg-blue-600/5 border border-blue-500/20 rounded-2xl p-6 flex items-start gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-full shrink-0 border border-blue-500/20">
                         <Info className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="space-y-1">
                         <h4 className="text-white font-bold text-sm">Personalizing your experience</h4>
                         <p className="text-slate-400 text-[11px] leading-relaxed">Your profile details are used to personalize the platform experience, influencing analysis depth, component valuation, project recommendations, and ResQ-Store suggestions.</p>
                      </div>
                   </div>

                   <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                      <div className="absolute top-4 right-8">
                         <div className="bg-blue-600/10 text-blue-500 text-[9px] font-black px-3 py-1 rounded-full border border-blue-500/20 uppercase">Profile Completion: 67%</div>
                      </div>
                      <label className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-800/50 shadow-inner group cursor-pointer relative overflow-hidden">
                         {user.profileImageUrl ? (
                           <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                         ) : (
                           <User className="w-10 h-10 text-slate-500" />
                         )}
                         <div className="absolute inset-0 bg-slate-950/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity flex-col gap-1">
                            {isUploadingImage ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Edit className="w-6 h-6 text-white" />}
                         </div>
                         <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                      </label>
                      <div className="text-center md:text-left flex-1">
                         <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Full Name</p>
                         <h3 className="text-3xl font-bold text-white tracking-tighter mb-4">{user.name}</h3>
                         <div className="grid grid-cols-2 gap-8">
                            <div>
                               <p className="text-[10px] text-slate-600 font-bold uppercase mb-2">Role / Level</p>
                               <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">{user.role}</span>
                            </div>
                            <div>
                               <div className="text-[10px] text-slate-600 font-bold uppercase mb-2 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Primary Focus</div>
                               <span className="text-slate-300 text-xs font-bold leading-tight">{user.domain || 'Troubleshooter, Analyzer'}</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                         <span className="text-[10px] text-slate-600 font-bold uppercase block mb-3">University / Organization</span>
                         <p className="text-white text-sm font-bold leading-relaxed">{user.university || 'Delhi Skills and Entrepreneurship Universities'}</p>
                      </div>
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                         <span className="text-[10px] text-slate-600 font-bold uppercase block mb-3">Age</span>
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-800 border border-slate-700 rounded flex items-center justify-center text-slate-500 text-xs font-bold">#</div>
                            <p className="text-white text-sm font-bold">{user.age || '20'} Years Old</p>
                         </div>
                      </div>
                   </div>
                   
                   {/* Engineering Summary */}
                   <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                     <span className="text-[10px] text-slate-600 font-bold uppercase block mb-3">Engineering Summary (Optional)</span>
                     <p className="text-white text-sm leading-relaxed">{user.engineeringSummary || 'No summary provided.'}</p>
                   </div>

                   {/* Technical Interests */}
                   <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                     <span className="text-[10px] text-slate-600 font-bold uppercase block mb-3 flex items-center gap-2"><Zap className="w-3 h-3 text-slate-500" /> Technical Interests</span>
                     {user.technicalInterests && user.technicalInterests.length > 0 ? (
                       <div className="flex flex-wrap gap-2">
                         {user.technicalInterests.map((interest, idx) => (
                           <span key={idx} className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-700">
                             {interest}
                           </span>
                         ))}
                       </div>
                     ) : (
                       <p className="text-slate-500 text-sm">No interests selected.</p>
                     )}
                   </div>

                   <p className="text-slate-500 text-xs text-center px-4 mt-8">
                      Your profile influences analysis depth, component valuation, and project recommendations.
                   </p>

                   <button 
                     onClick={() => setIsEditingProfile(true)} 
                     className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                   >
                     <Edit className="w-5 h-5" /> Edit Profile
                   </button>
                </>
              )}
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
               <h3 className="text-xl font-bold text-white mb-6">Interface Customization</h3>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)} className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${theme === t.id ? 'border-blue-600 bg-blue-600/10' : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800'}`}>
                      <div className="w-10 h-10 rounded-full border-2 border-slate-700 shadow-xl" style={{ background: t.color }} />
                      <span className="text-xs font-bold text-white">{t.name}</span>
                    </button>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
               <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Security Controls</h3>
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
                     <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Update Password</p>
                     <div className="flex flex-col gap-3">
                        <input type="password" placeholder="Current Password" value={passData.current} onChange={e => setPassData({...passData, current: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none transition-all"/>
                        <div className="grid grid-cols-2 gap-3">
                           <input type="password" placeholder="New Password" value={passData.new} onChange={e => setPassData({...passData, new: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none transition-all"/>
                           <input type="password" placeholder="Confirm New" value={passData.confirm} onChange={e => setPassData({...passData, confirm: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none transition-all"/>
                        </div>
                        <button onClick={handleUpdatePassword} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors border border-slate-700">Update Password</button>
                        {passStatus.text && <p className={`text-[10px] font-bold ${passStatus.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>{passStatus.text}</p>}
                     </div>
                  </div>
               </div>

               {isAdmin && (
                  <div className="space-y-6">
                     <h3 className="text-xl font-bold text-amber-500 flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6" /> Admin Security Controls
                     </h3>
                     
                     <div className="bg-amber-600/5 border border-amber-600/20 rounded-2xl p-6 space-y-5">
                        <div className="space-y-1">
                           <h4 className="text-amber-500 font-bold text-sm flex items-center gap-2"><Zap className="w-4 h-4" /> YOUR PERSONAL LOGIN KEY</h4>
                           <p className="text-slate-500 text-[10px]">Set a secure key to use "Quick Login" and bypass email OTP verification.</p>
                        </div>
                        <div className="flex gap-3">
                           <input type="password" placeholder="Set new login key..." value={loginKey} onChange={e => setLoginKey(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none font-mono"/>
                           <button onClick={handleUpdateLoginKey} className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95">Save Key</button>
                        </div>
                     </div>

                     <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-5">
                        <div className="space-y-1">
                           <h4 className="text-slate-300 font-bold text-sm flex items-center gap-2"><KeyRound className="w-4 h-4" /> UPDATE MASTER KEY (SYSTEM WIDE)</h4>
                           <p className="text-slate-500 text-[10px]">This key is required to register new Admin accounts. Only you can change this.</p>
                        </div>
                        <div className="flex gap-3">
                           <input type="password" placeholder="Enter new master key..." value={masterKey} onChange={e => setMasterKey(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none font-mono"/>
                           <button onClick={handleUpdateMasterKey} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700">Update</button>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                           <Users className="w-4 h-4" />
                           <span className="text-[10px] font-bold uppercase tracking-widest">Authorized Admin Team</span>
                        </div>
                        <div className="bg-slate-950/50 border border-slate-800 border-dashed rounded-2xl p-10 text-center">
                           <p className="text-slate-700 text-xs italic font-medium">No additional admins registered.</p>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                           <span>Max 2 additional admins allowed.</span>
                           <span>0/2 Used</span>
                        </div>
                     </div>
                  </div>
               )}
            </div>
          )}

          {activeTab === 'helpdesk' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
               <h3 className="text-xl font-bold text-white mb-6">Helpdesk Support</h3>
               <p className="text-slate-500 text-sm -mt-4 mb-8">Create tickets and view admin responses.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Changed to grid-cols-1 for better layout if one section is dynamic */}
                  {/* Dynamic FAQ List */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 shrink-0">
                          <HelpCircle className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-base">General Help (FAQs)</h4>
                          <p className="text-slate-500 text-xs mt-1">Common questions & answers</p>
                        </div>
                      </div>
                    </div>
                    
                    {loadingFaqs ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      </div>
                    ) : faqs.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-4">No FAQs available yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {faqs.map(faq => (
                          <div 
                            key={faq.id} 
                            className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden"
                          >
                            <button 
                              onClick={() => setExpandedFaqId(expandedFaqId === faq.id ? null : faq.id)}
                              className="w-full text-left p-3 flex items-center justify-between hover:bg-slate-800 transition-colors"
                            >
                              <span className="font-medium text-slate-200 text-sm">{faq.question}</span>
                              {expandedFaqId === faq.id ? <Minus className="w-4 h-4 text-slate-400" /> : <Plus className="w-4 h-4 text-slate-400" />}
                            </button>
                            {expandedFaqId === faq.id && (
                              <div className="p-3 pt-0 text-slate-400 text-xs leading-relaxed border-t border-slate-800 bg-slate-900">
                                {faq.answer}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Admin Support Section */}
                  {showHelpForm ? (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-white font-bold text-sm">Submit Help Request</h4>
                        <button onClick={() => setShowHelpForm(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4"/></button>
                      </div>
                      <form onSubmit={handleSubmitHelp} className="space-y-4">
                        <div>
                          <textarea
                            value={helpQuery}
                            onChange={(e) => setHelpQuery(e.target.value)}
                            placeholder="How can we help?"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white h-24 resize-none focus:border-blue-500 outline-none placeholder:text-slate-600 text-sm"
                            required
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{2 - helpsUsed} requests remaining</span>
                          <button
                            type="submit"
                            disabled={isSubmittingHelp || !helpQuery.trim() || helpsUsed >= 2}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isSubmittingHelp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit
                          </button>
                        </div>
                        {helpsUsed >= 2 && (
                          <p className="text-xs text-amber-500 mt-2">You have reached the maximum number of requests for this session.</p>
                        )}
                      </form>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setShowHelpForm(true)}
                      className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-all cursor-pointer group"
                    >
                       <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20 group-hover:bg-emerald-600/20 transition-colors shrink-0">
                          <Mail className="w-6 h-6 text-emerald-500" />
                       </div>
                       <h4 className="text-white font-bold text-sm">Admin Support</h4>
                       <p className="text-slate-500 text-[10px] mt-1">General Help & Inquiries</p>
                    </div>
                  )}
               </div>

               <div className="space-y-4 pt-6 border-t border-slate-800">
                  <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                     <Clock className="w-4 h-4" /> TICKET HISTORY
                  </h4>
                  
                  {loadingHelp ? <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" /> : helpHistory.length === 0 ? (
                    <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-8 text-center">
                       <p className="text-slate-600 text-xs italic">No previous support tickets.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       {helpHistory.map(h => (
                         <div key={h.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 h-full w-1 bg-emerald-500/30"></div>
                            <div className="flex justify-between items-start">
                               <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${h.type === 'admin' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                     {h.type === 'admin' ? <Mail className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                                  </div>
                                  <div>
                                     <h5 className="text-white font-bold text-sm">{h.type === 'admin' ? 'Admin Support' : 'General Help'}</h5>
                                     <span className="text-[9px] text-slate-500">{new Date(h.timestamp).toLocaleString()}</span>
                                  </div>
                               </div>
                               <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${h.status === 'resolved' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-amber-400 border-amber-500/20 bg-amber-500/5'}`}>
                                  <div className="flex items-center gap-1"><div className={`w-1 h-1 rounded-full ${h.status === 'resolved' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div> {h.status === 'resolved' ? 'Solved' : 'Pending'}</div>
                               </span>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                               <p className="text-slate-300 text-xs leading-relaxed italic">"{h.queryText}"</p>
                            </div>
                            {h.responseText && (
                               <div className="bg-emerald-600/5 p-3 rounded-xl border border-emerald-600/10 mt-2">
                                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest block mb-1">Admin Response</span>
                                  <p className="text-emerald-400/80 text-xs leading-relaxed">{h.responseText}</p>
                               </div>
                            )}
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
               <h3 className="text-xl font-bold text-white mb-6">Give Feedback</h3>
               <p className="text-slate-500 text-sm -mt-4 mb-8">Share your experience to help us improve ElectroRescue.</p>
               
               <form onSubmit={handleSubmitFeedback} className="space-y-6">
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                     <Star className="w-3 h-3" /> Overall Rating
                   </label>
                   <div className="flex items-center gap-1 mt-2">
                     {[1, 2, 3, 4, 5].map((star) => (
                       <Star
                         key={star}
                         className={`w-8 h-8 cursor-pointer transition-colors ${
                           star <= feedbackRating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'
                         }`}
                         onClick={() => setFeedbackRating(star)}
                       />
                     ))}
                   </div>
                   {feedbackStatus === 'error' && feedbackRating === 0 && (
                      <p className="text-red-400 text-xs mt-2">Please select a rating.</p>
                   )}
                 </div>

                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                     Your Comments
                   </label>
                   <textarea
                     className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white h-32 resize-none focus:border-blue-500 outline-none placeholder:text-slate-600"
                     placeholder="What did you like? What could be improved? Any bugs?"
                     value={feedbackComment}
                     onChange={(e) => setFeedbackComment(e.target.value)}
                   />
                 </div>
                 
                 {feedbackStatus === 'success' && (
                   <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400 text-sm animate-in slide-in-from-top-2">
                     <CheckCircle2 className="w-4 h-4 shrink-0" />
                     Feedback submitted successfully! Thanks for your input.
                   </div>
                 )}
                 {feedbackStatus === 'error' && (
                   <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-in slide-in-from-top-2">
                     <AlertCircle className="w-4 h-4 shrink-0" />
                     Failed to submit feedback. Please try again.
                   </div>
                 )}

                 <button
                   type="submit"
                   className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                   disabled={feedbackStatus === 'success' || (feedbackRating === 0 && !feedbackComment.trim())}
                 >
                   <Send className="w-5 h-5" /> Submit Feedback
                 </button>
               </form>
            </div>
          )}
          {activeTab === 'adminSettings' && isAdmin && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
               <h3 className="text-xl font-bold text-white mb-6">Admin Settings</h3>
               <p className="text-slate-500 text-sm -mt-4 mb-8">Manage application-wide configurations.</p>
               
               <div className="space-y-6">
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
                     <div className="space-y-1">
                        <h4 className="text-slate-300 font-bold text-sm flex items-center gap-2">
                           <Palette className="w-4 h-4" /> App Logo
                        </h4>
                        <p className="text-slate-500 text-xs">Upload a custom logo to replace the default ElectroRescue logo for all users.</p>
                     </div>
                     <div className="flex items-center gap-4 mt-4">
                        <label className="relative cursor-pointer">
                          <input type="file" accept="image/*" className="hidden" onChange={handleAppLogoUpload} disabled={isUploadingAppLogo} />
                          <div className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition flex items-center gap-2">
                            {isUploadingAppLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {isUploadingAppLogo ? 'Uploading...' : 'Upload Logo'}
                          </div>
                        </label>
                        <p className="text-xs text-slate-500 italic">Recommended format: SVG or transparent PNG.</p>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;