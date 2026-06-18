
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import ComponentList from './components/ComponentList';
import DamageReport from './components/DamageReport';
import ValuationPanel from './components/ValuationPanel';
import ChatWidget from './components/ChatWidget';
import HistoryPanel from './components/HistoryPanel';
import ProjectCreator from './components/ProjectCreator';
import LoginPage from './components/LoginPage';
import DashboardSidebar from './components/DashboardSidebar';
import OnboardingModal from './components/OnboardingModal';
import Marketplace from './components/Marketplace';
import ERResQ from './components/ERResQ';
import AdminNotifications from './components/AdminNotifications';
import SellProductModal from './components/SellProductModal';
import MyProductStatus from './components/MyProductStatus';
import { analyzePCBImage } from './services/geminiService';
import { AnalysisResult, AnalysisState, HistoryItem, UserProfile, ProjectIdea } from './types';
import { Lightbulb, PenTool, Sparkles, ArrowRight, X, Home, Store, User, Edit2, LogOut, ShieldAlert, LayoutDashboard, Search, FileText, Flame, Layers, Zap, Clipboard, DollarSign, Rocket } from 'lucide-react'; // Added new icons

import { db } from './services/firebase';
import { doc, updateDoc, addDoc, collection, onSnapshot, setDoc } from 'firebase/firestore';
import { sendGeneralEmail } from './services/emailService';

const STORAGE_KEY = 'electro_rescue_history';
const USER_KEY = 'electro_rescue_user';
const ADMIN_EMAIL = 'electrorescuehelp@gmail.com';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'marketplace' | 'er-resq' | 'projects' | 'my-products'>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // States for Theme and Sidebar
  const [theme, setTheme] = useState('theme-dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);

  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    result: null,
    error: null,
    imagePreview: null,
  });

  // Fetch app settings
  useEffect(() => {
    const settingsRef = doc(db, 'app_settings', 'global');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().logoUrl) {
           setAppLogoUrl(docSnap.data().logoUrl);
        } else {
           setAppLogoUrl(null);
        }
    }, (error) => {
        console.error("Failed to fetch settings:", error);
    });
    return () => unsubscribe();
  }, []);

  const [imageQueue, setImageQueue] = useState<File[]>([]);
  const isProcessingQueue = useRef(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAdminNotifOpen, setIsAdminNotifOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  
  const [selectedProject, setSelectedProject] = useState<ProjectIdea | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.email === ADMIN_EMAIL || user?.role === 'Admin';

  // Theme Effect
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Check for logged in user on mount
  useEffect(() => {
    try {
        const savedUser = localStorage.getItem(USER_KEY);
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            if (!parsedUser.age || !parsedUser.university || !parsedUser.domain) {
                setShowOnboarding(true);
            }
        }
    } catch (e) {
        console.error("Failed to load user session", e);
    }
  }, []);

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  // Save history helper
  const saveToHistory = (newItem: HistoryItem) => {
    setHistory(prev => {
      if (newItem.type === 'project' && newItem.project) {
          const exists = prev.some(item => item.type === 'project' && item.project?.title === newItem.project?.title);
          if (exists) return prev;
      }
      const updated = [newItem, ...prev].slice(0, 20);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Storage quota exceeded", e);
      }
      return updated;
    });
  };

  const removeFromHistory = (id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleLogin = (userData: UserProfile) => {
      setUser(userData);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      if (!userData.age || !userData.university) {
          setShowOnboarding(true);
      }
  };

  const handleUpdateProfile = async (updatedUser: UserProfile) => {
      setUser(updatedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      try {
        const userRef = doc(db, "users", updatedUser.email);
        await updateDoc(userRef, {
            age: updatedUser.age,
            university: updatedUser.university,
            domain: updatedUser.domain,
            role: updatedUser.role,
            technicalInterests: updatedUser.technicalInterests || [],
            usageContext: updatedUser.usageContext || 'Learning',
            engineeringSummary: updatedUser.engineeringSummary || ''
        });
      } catch (e) {
        console.error("Failed to sync profile update to cloud", e);
      }
      setShowOnboarding(false);
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem(USER_KEY);
      handleReset();
      setCurrentView('dashboard');
  };

  const handleSellProductSubmit = async (title: string, description: string, price: string, contactInfo: string) => {
      if (!user || !state.result) return;
      try {
          const newItem = {
              sellerId: user.id,
              sellerName: user.name,
              timestamp: Date.now(),
              title,
              description,
              price: price.replace(/[^0-9]/g, ''), 
              condition: state.result.damageAssessment.conditionGrade === 'A' ? 'Used - Like New' : 'Salvaged / For Parts',
              contactInfo,
              imageUrl: state.imageBase64 || state.imagePreview || '',
              status: 'pending'
          };
          await addDoc(collection(db, "er_requests"), { ...newItem, id: Date.now().toString() });
          await sendGeneralEmail(
              user.email,
              "Request Received - ER-ResQ Market",
              `Hello ${user.name},\n\nWe have received your request to sell a ${state.result?.pcbCategory || "component"} lot.\n\nOur Admin team will review your submission and update the status shortly.`,
              "template_nt1tje2"
          );
          alert("Item submitted to ER-ResQ! A confirmation email has been sent.");
          setIsSellModalOpen(false);
          setCurrentView('dashboard');
      } catch (error) {
          console.error("Error adding to er_requests:", error);
          alert("Failed to list item.");
      }
  };

  const processQueue = async (currentQueue: File[]) => {
    if (currentQueue.length === 0) {
      isProcessingQueue.current = false;
      return;
    }
    
    isProcessingQueue.current = true;
    const file = currentQueue[0];
    const objectUrl = URL.createObjectURL(file);
    setState(prev => ({ ...prev, isLoading: true, error: null, imagePreview: objectUrl, result: null }));
    
    try {
      const reader = new FileReader();
      const loadPromise = new Promise<{base64String: string, base64Data: string}>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          resolve({ base64String, base64Data });
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      
      const { base64String, base64Data } = await loadPromise;
      const mimeType = file.type;
      
      const result = await analyzePCBImage(base64Data, mimeType);
      setState(prev => ({ ...prev, isLoading: false, result, imageBase64: base64String }));
      saveToHistory({ id: Date.now().toString(), timestamp: Date.now(), type: 'analysis', result, imageData: base64String });
      setTimeout(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message || "Failed to analyze image. Please try again." }));
    }
    
    // Dequeue and process next
    setImageQueue(prevQueue => {
      const nextQueue = prevQueue.slice(1);
      if (nextQueue.length > 0) {
        // slight delay to let user see the result of current scan before starting next
        setTimeout(() => processQueue(nextQueue), 3000); 
      } else {
        isProcessingQueue.current = false;
      }
      return nextQueue;
    });
  };

  const handleImageSelect = async (files: File[]) => {
    setImageQueue(prev => {
      const newQueue = [...prev, ...files];
      if (!isProcessingQueue.current) {
        setTimeout(() => processQueue(newQueue), 50);
      }
      return newQueue;
    });
  };

  const handleHistorySelect = (item: HistoryItem) => {
    if (item.type === 'project' && item.project) {
       setCurrentView('projects');
       setSelectedProject(item.project);
    } else if (item.result && item.imageData) {
       setCurrentView('dashboard');
       setState({ isLoading: false, result: item.result, error: null, imagePreview: item.imageData, imageBase64: item.imageData });
       setTimeout(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
    }
    setIsHistoryOpen(false);
  };

  const handleReset = () => {
    setImageQueue([]);
    isProcessingQueue.current = false;
    setState({ isLoading: false, result: null, error: null, imagePreview: null, imageBase64: null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user) {
      return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col md:flex-row">
      
      <DashboardSidebar 
        user={user} 
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        onEditProfile={() => setShowOnboarding(true)}
        theme={theme}
        setTheme={setTheme}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex-1 h-screen overflow-y-auto flex flex-col transition-all duration-300 ease-in-out relative">
        
        <div className="sticky top-0 z-50">
             <Header 
                onNewAnalysis={handleReset} 
                onToggleHistory={() => setIsHistoryOpen(true)}
                onToggleNotifications={isAdmin ? () => setIsAdminNotifOpen(true) : undefined}
                user={user}
                onLogout={handleLogout}
                appLogoUrl={appLogoUrl}
            />
        </div>

        <div className="flex-1 pb-24 md:pb-8">
            <HistoryPanel 
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                history={history}
                onSelect={handleHistorySelect}
                onClear={clearHistory}
                onDelete={removeFromHistory}
            />

            <AdminNotifications 
              isOpen={isAdminNotifOpen} 
              onClose={() => setIsAdminNotifOpen(false)} 
            />
            
            {showOnboarding && (
            <OnboardingModal 
                user={user} 
                onUpdate={handleUpdateProfile}
                onCancel={user.age ? () => setShowOnboarding(false) : undefined}
                theme={theme}
                setTheme={setTheme}
            />
            )}

            {/* Removed max-w-7xl wrapper */}
            {currentView === 'er-resq' && isAdmin && (
                <ERResQ user={user} />
            )}

            {currentView === 'my-products' && (
                <MyProductStatus user={user} />
            )}

            {currentView === 'marketplace' && (
                <Marketplace user={user} isAdmin={isAdmin} />
            )}

            {currentView === 'projects' && (
                <ProjectCreator 
                    onGoToStore={() => setCurrentView('marketplace')}
                    onSaveHistory={(project, type) => saveToHistory({
                        id: Date.now().toString(),
                        timestamp: Date.now(),
                        type: 'project',
                        project: project,
                        projectSource: type
                    })}
                    initialProject={selectedProject}
                    user={user}
                />
            )}

            {currentView === 'dashboard' && (
                <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-500">
                    {/* Updated Introductory Text */}
                    <div className="max-w-full lg:max-w-6xl mx-auto space-y-4">
                        <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight mb-2">
                            Get a quick, intelligent overview of your PCB before taking any action.
                        </h2>
                        <p className="text-slate-300 text-sm md:text-lg leading-relaxed">
                            ELECTRORESCUE.AI analyzes the image and provides insights such as component detection, damage identification, and salvage valuation—all in one place.
                        </p>
                    </div>

                    {/* Overview Section - New block matching screenshot */}
                    <div className="max-w-full lg:max-w-6xl mx-auto px-6 py-8 rounded-xl bg-slate-800/50 border border-slate-700 space-y-4">
                        <h3 className="text-xl font-bold text-white mb-2">Overview</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Upload a clear photo of any printed circuit board. Our system identifies the components,
                            detects issues like burns, corrosion, or missing parts, and calculates component-level salvage
                            value.
                        </p>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            You can upload one PCB image at a time, and each analysis will automatically be saved in your
                            History for later review.
                        </p>
                    </div>

                    {/* Scanning Guide Map */}
                    <div className="max-w-full lg:max-w-6xl mx-auto px-6 py-8 rounded-xl bg-slate-800/40 border border-slate-700 space-y-6">
                        <h3 className="text-xl font-bold text-white mb-2">How to Scan a PCB</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                            {/* Connecting Line for desktop */}
                            <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-[2px] bg-slate-700" />
                            
                            <div className="flex flex-col items-center text-center space-y-3 relative z-10">
                                <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-blue-400 font-bold text-xl border-4 border-slate-800/50 shadow-xl">1</div>
                                <h4 className="font-semibold text-white">Upload Image</h4>
                                <p className="text-sm text-slate-400">Take a clear, well-lit photo of the entire printed circuit board. Ensure components are clearly visible without blurry motion.</p>
                            </div>
                            <div className="flex flex-col items-center text-center space-y-3 relative z-10">
                                <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-emerald-400 font-bold text-xl border-4 border-slate-800/50 shadow-xl">2</div>
                                <h4 className="font-semibold text-white">AI Analysis</h4>
                                <p className="text-sm text-slate-400">Our computer vision model actively scans the board to detect damaged components, circuitry paths, and identifies salvageable parts.</p>
                            </div>
                            <div className="flex flex-col items-center text-center space-y-3 relative z-10">
                                <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-purple-400 font-bold text-xl border-4 border-slate-800/50 shadow-xl">3</div>
                                <h4 className="font-semibold text-white">Review Report</h4>
                                <p className="text-sm text-slate-400">Access your complete breakdown and valuation report. Get insights and decide whether to recycle, repair or list for salvage on the marketplace.</p>
                            </div>
                        </div>
                    </div>

                    {/* Upload/Preview Section */}
                    <div className="max-w-full lg:max-w-6xl mx-auto w-full">
                        {state.imagePreview ? (
                        <div className="relative rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-2xl min-h-[300px] md:min-h-[450px]">
                            <img src={state.imagePreview} alt="PCB Preview" className="w-full h-full object-contain mx-auto bg-slate-950/50" />
                            {!state.isLoading && (
                            <button onClick={handleReset} className="absolute top-3 right-3 md:top-4 md:right-4 p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full border border-slate-700 transition-colors">
                                <X className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                            )}
                            {state.isLoading && (
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center overflow-hidden">
                                <div className="absolute left-0 right-0 h-1 bg-accent/80 animate-laser-scan z-10 w-full" style={{ boxShadow: '0 0 20px 5px var(--accent)' }}></div>
                                <div className="text-center relative z-20">
                                    <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-white font-mono text-sm px-4 py-2 bg-black/30 backdrop-blur-md rounded border border-blue-500/20 shadow-lg">
                                        {imageQueue.length > 0 ? `Scanning PCB (1 of ${imageQueue.length + 1})...` : 'Scanning PCB...'}
                                    </p>
                                </div>
                            </div>
                            )}
                            {(imageQueue.length > 0 && !state.isLoading) && (
                                <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full border border-blue-500/30 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                    Queued: {imageQueue.length} remaining
                                </div>
                            )}
                        </div>
                        ) : (
                        <ImageUpload onImageSelect={handleImageSelect} isLoading={state.isLoading} queueLength={imageQueue.length} />
                        )}
                        {state.error && <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-xs md:text-sm">{state.error}</div>}
                    </div>

                    {/* Analysis Result */}
                    {state.result && (
                    <div ref={scrollRef} className="max-w-full lg:max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <h2 className="text-xl md:text-2xl font-bold text-white">Analysis Report</h2>
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] md:text-xs font-mono rounded-full border border-blue-500/20">{state.result.pcbCategory}</span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <ComponentList components={state.result.components} summary={state.result.summary} />
                                <div className="bg-slate-800/20 p-5 md:p-6 rounded-lg border border-slate-800">
                                    <h3 className="text-base md:text-lg font-semibold text-white mb-3 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-400" />Insights</h3>
                                    <p className="text-slate-300 text-sm leading-relaxed">{state.result.technicalInsights}</p>
                                </div>
                                <DamageReport assessment={state.result.damageAssessment} />
                            </div>
                            <div className="space-y-6">
                                <ValuationPanel cost={state.result.costAnalysis} valuation={state.result.finalValuation} onAddToMarket={() => setIsSellModalOpen(true)} />
                            </div>
                        </div>
                    </div>
                    )}
                </main>
            )}
        </div>

        {isSellModalOpen && state.result && (
            <SellProductModal
                user={user}
                defaultPrice={state.result.finalValuation.asIsValue}
                pcbCategory={state.result.pcbCategory}
                defaultDescription={`Automated Listing: ${state.result.summary.join(', ')}. Condition: ${state.result.damageAssessment.conditionGrade}.`}
                onClose={() => setIsSellModalOpen(false)}
                onSubmit={handleSellProductSubmit}
            />
        )}

        {/* Mobile Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 md:hidden flex items-center justify-around px-2 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.5)]">
            <button 
                onClick={() => setCurrentView('dashboard')}
                className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'dashboard' ? 'text-blue-500' : 'text-slate-500'}`}
            >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px] font-bold">Analyser</span>
            </button>
            {!isAdmin && (
                <button 
                    onClick={() => setCurrentView('projects')}
                    className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'projects' ? 'text-emerald-500' : 'text-slate-500'}`}
                >
                    <PenTool className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Projects</span>
                </button>
            )}
            <button 
                onClick={() => setCurrentView('marketplace')}
                className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'marketplace' ? 'text-teal-500' : 'text-slate-500'}`}
            >
                <Store className="w-5 h-5" />
                <span className="text-[10px] font-bold">ResQ Store</span>
            </button>
            {!isAdmin && (
                <button 
                    onClick={() => setCurrentView('my-products')}
                    className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'my-products' ? 'text-indigo-500' : 'text-slate-500'}`}
                >
                    <Clipboard className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Status</span>
                </button>
            )}
            {isAdmin && (
                <button 
                    onClick={() => setCurrentView('er-resq')}
                    className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'er-resq' ? 'text-amber-500' : 'text-slate-500'}`}
                >
                    <ShieldAlert className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Admin</span>
                </button>
            )}
            <button 
                onClick={() => setShowOnboarding(true)}
                className="flex flex-col items-center gap-1 text-slate-500"
            >
                <User className="w-5 h-5" />
                <span className="text-[10px] font-bold">Profile</span>
            </button>
        </nav>
      </div>
      <ChatWidget userRole={user.role} />
    </div>
  );
};

export default App;
