
import React, { useState, useEffect } from 'react';
import { ProjectIdea, UserProfile } from '../types';
import { generateProjectIdeas, getRecommendedProjects, getProjectGuide } from '../services/geminiService';
import { Lightbulb, PenTool, Loader2, AlertCircle, CheckCircle2, ListOrdered, ShoppingBag, Clock, ChevronRight, ChevronDown, ChevronUp, Sparkles, Zap, Cpu, Signal, Wrench, Search, ArrowLeft, ArrowRight, Mail, RefreshCw, MessageCircle, Rocket } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import Marketplace from './Marketplace';
import ContactAdminModal from './ContactAdminModal'; // Import the new modal

interface ProjectCreatorProps {
  onGoToStore?: () => void;
  onSaveHistory: (project: ProjectIdea, type: 'inventory' | 'recommended') => void;
  initialProject: ProjectIdea | null;
  user: UserProfile | null;
}

const ADMIN_EMAIL = 'electrorescuehelp@gmail.com';

const ProjectCreator: React.FC<ProjectCreatorProps> = ({ onGoToStore, onSaveHistory, initialProject, user }) => {
  const [view, setView] = useState<'landing' | 'create' | 'explore' | 'guide'>('landing');
  const [components, setComponents] = useState('');
  const [generatedProjects, setGeneratedProjects] = useState<ProjectIdea[]>([]);
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);
  const [recommendedProjects, setRecommendedProjects] = useState<ProjectIdea[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [currentProject, setCurrentProject] = useState<ProjectIdea | null>(null);
  const [loadingGuideTitle, setLoadingGuideTitle] = useState<string | null>(null);
  const [requestingKit, setRequestingKit] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContactAdminModal, setShowContactAdminModal] = useState(false); // New state for contact admin modal

  useEffect(() => {
    if (initialProject) {
      setCurrentProject(initialProject); setView('guide');
    }
  }, [initialProject]);

  const fetchRecommended = async (refresh = false) => {
      if(!refresh && recommendedProjects.length > 0) return;
      setLoadingRecommended(true);
      try {
          const res = await getRecommendedProjects([]);
          setRecommendedProjects(res);
      } catch (e) { console.error(e); }
      finally { setLoadingRecommended(false); }
  };

  useEffect(() => { if(view === 'explore') fetchRecommended(); }, [view]);

  const handleGenerate = async () => {
    if (!components.trim()) return;
    setIsLoading(true); setError(null); setGeneratedProjects([]);
    try {
      const results = await generateProjectIdeas(components);
      setGeneratedProjects(results);
    } catch (err) { setError("Failed to generate ideas."); }
    finally { setIsLoading(false); }
  };

  const handleViewGuide = async (project: ProjectIdea, source: 'inventory' | 'recommended') => {
      setLoadingGuideTitle(project.title);
      let projectToView = { ...project };
      if (!projectToView.steps || projectToView.steps.length === 0) {
          try {
              const steps = await getProjectGuide(project.title, project.missingComponents);
              projectToView.steps = steps;
              if (source === 'recommended') setRecommendedProjects(prev => prev.map(p => p.title === project.title ? projectToView : p));
              else setGeneratedProjects(prev => prev.map(p => p.title === project.title ? projectToView : p));
          } catch (e) { console.error(e); }
      }
      setCurrentProject(projectToView); onSaveHistory(projectToView, source);
      setLoadingGuideTitle(null); setView('guide');
  };

  const getDifficultyStyle = (diff: string) => {
    switch (diff) {
      case 'Beginner': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <Sparkles className="w-3 h-3 text-emerald-400" /> };
      case 'Intermediate': return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: <Zap className="w-3 h-3 text-blue-400" /> };
      case 'Advanced': return { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: <Cpu className="w-3 h-3 text-purple-400" /> };
      default: return { color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-700', icon: <Signal className="w-3 h-3" /> };
    }
  };

  if (showStore && user) {
      return (
          <div className="h-full flex flex-col bg-slate-950 animate-in fade-in duration-300">
              <div className="px-4 md:px-6 py-4 border-b border-slate-800 bg-slate-900 flex items-center gap-3">
                  <button onClick={() => setShowStore(false)} className="p-2 bg-slate-800 text-slate-300 rounded-lg flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> <span className="text-xs font-bold">Back</span></button>
                  <span className="text-sm text-slate-400">ResQ-Store</span>
              </div>
              <div className="flex-1 overflow-hidden"><Marketplace user={user} isAdmin={user.email === ADMIN_EMAIL} /></div>
          </div>
      );
  }

  if (view === 'landing') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="text-center mb-10">
           <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/10">
              <Rocket className="w-8 h-8 text-white" />
           </div>
           <h2 className="text-4xl font-bold text-white mb-2">Project Engineer</h2>
           <p className="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
              Transform your components into working prototypes. Choose how you want to start building today.
           </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-12">
           <button onClick={() => setView('create')} className="group bg-slate-900 border border-slate-800 rounded-2xl p-8 text-left hover:border-emerald-500/40 transition-all flex flex-col gap-6 relative overflow-hidden">
              {/* Background Icon */}
              <Sparkles className="absolute -bottom-6 -right-6 w-32 h-32 text-emerald-500 opacity-5 pointer-events-none" />
              <div className="w-14 h-14 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-600/20 transition-colors shrink-0">
                <Sparkles className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Create Your Own</h3>
                <p className="text-slate-400 leading-relaxed mt-2">Input your inventory list and let our AI generate tailored projects based on exactly what you have on hand.</p>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold transition-colors mt-4 text-sm">
                 Start Building <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
           </button>
           <button 
                onClick={() => {
                    setView('explore');
                    setGeneratedProjects([]); // Clear generated projects
                    setComponents(''); // Clear components list
                }} 
                className="group bg-slate-900 border border-slate-800 rounded-2xl p-8 text-left hover:border-blue-500/40 transition-all flex flex-col gap-6 relative overflow-hidden"
            >
              {/* Background Icon */}
              <Lightbulb className="absolute -bottom-6 -right-6 w-32 h-32 text-blue-500 opacity-5 pointer-events-none" />
              <div className="w-14 h-14 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-600/20 transition-colors shrink-0">
                <Lightbulb className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Explore Ideas</h3>
                <p className="text-slate-400 leading-relaxed mt-2">Browse our curated list of 10 recommended projects ranging from beginner circuits to advanced robotics.</p>
              </div>
              <div className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold transition-colors mt-4 text-sm">
                 View Catalog <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
           </button>
        </div>
      </div>
    );
  }

  if (view === 'guide' && currentProject && user) {
      const style = getDifficultyStyle(currentProject.difficulty);
      return (
          <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                  <button onClick={() => setView(generatedProjects.length > 0 ? 'create' : 'explore')} className="p-2 bg-slate-800 rounded-lg text-slate-400"><ArrowLeft className="w-5 h-5" /></button>
                  <h2 className="text-xl md:text-2xl font-bold text-white truncate">{currentProject.title}</h2>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${style.color} ${style.bg} shrink-0`}>
                      {currentProject.difficulty}
                  </span>
              </div>
              <div className="flex flex-col lg:flex-row gap-6">
                  <div className="lg:w-1/3 space-y-4">
                       <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl"><p className="text-slate-300 text-sm">{currentProject.description}</p></div>
                       <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Components</h3>
                           <div className="flex flex-col gap-2">
                               {currentProject.missingComponents.map((c, i) => <div key={i} className="bg-slate-950 p-2 rounded text-xs text-slate-300 border border-slate-800">• {c}</div>)}
                           </div>

                           <button onClick={() => setShowStore(true)} className="w-full py-3 bg-emerald-600/10 text-emerald-400 rounded-lg text-sm font-bold border border-emerald-500/20">Check ResQ Store</button>
                           
                           {/* New Contact Admin button */}
                           <button onClick={() => setShowContactAdminModal(true)} className="w-full py-3 bg-blue-600/10 text-blue-400 rounded-lg text-sm font-bold border border-blue-500/20 flex items-center justify-center gap-2">
                               <MessageCircle className="w-4 h-4" /> Contact Admin (for help)
                           </button>
                       </div>
                  </div>
                  <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-8 space-y-6">
                      <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-4">Build Guide</h3>
                      {currentProject.steps ? (
                          <div className="space-y-6 relative">
                              <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-800"></div>
                              {currentProject.steps.map((s, i) => (
                                  <div key={i} className="relative flex gap-4">
                                      <div className="w-7 h-7 rounded-full bg-slate-900 border border-blue-500 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 z-10">{i+1}</div>
                                      <p className="text-slate-300 text-sm leading-relaxed">{s}</p>
                                  </div>
                              ))}
                          </div>
                      ) : <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />}
                  </div>
              </div>
              {showContactAdminModal && (
                  <ContactAdminModal
                      isOpen={showContactAdminModal}
                      onClose={() => setShowContactAdminModal(false)}
                      user={user}
                      currentProject={currentProject}
                  />
              )}
          </div>
      );
  }

  if (view === 'create') {
      return (
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
              <button 
                  onClick={() => {
                      setView('landing');
                      setGeneratedProjects([]); // Clear generated projects when going back
                      setComponents(''); // Clear components list when going back
                  }} 
                  className="p-2 bg-slate-800 rounded-lg text-slate-400"
              >
                  <ArrowLeft className="w-5 h-5" />
              </button>
              <Sparkles className="w-6 h-6 text-emerald-500" />
              <h2 className="text-xl md:text-2xl font-bold text-white">Create Your Own</h2>
            </div>
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-slate-900/50 border border-slate-800 rounded-2xl">
                 <div className="w-full md:w-80 p-5 md:border-r border-slate-800 flex flex-col shrink-0">
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                      <Search className="w-3 h-3" /> Your Inventory
                    </label>
                    <textarea 
                        value={components} 
                        onChange={e => setComponents(e.target.value)} 
                        className="flex-1 min-h-[150px] bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white resize-none mb-4 outline-none focus:border-emerald-500/50 placeholder:text-slate-600" 
                        placeholder={`List your components here...\nExample:\n- Arduino Uno\n- 2x Servo Motors\n- Ultrasonic Sensor\n- Breadboard\n- Jumper Wires`} 
                    />
                    <button onClick={handleGenerate} disabled={isLoading || !components.trim()} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 text-sm">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Generate 5 Projects
                    </button>
                 </div>
                 <div className="flex-1 p-5 overflow-y-auto custom-scrollbar bg-slate-950/20 relative">
                    {isLoading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm">
                        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                        <p className="text-white text-lg font-bold">Generating Projects...</p>
                        <p className="text-slate-400 text-sm">This might take a moment.</p>
                      </div>
                    ) : generatedProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20">
                           <Sparkles className="w-20 h-20 text-blue-500 opacity-20 mb-6" />
                           <h3 className="text-2xl font-bold text-white mb-2">Ready to build?</h3>
                           <p className="text-slate-400 max-w-sm mx-auto">Enter your components on the left to generate tailored project ideas.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                                <h3 className="text-xl font-bold text-white">Project Matches</h3>
                                <span className="text-emerald-400 text-xs font-bold px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">{generatedProjects.length} Results</span>
                            </div>
                            {generatedProjects.map((p, i) => {
                                const style = getDifficultyStyle(p.difficulty);
                                return (
                                <div key={i} onClick={() => setExpandedProjectId(expandedProjectId === i ? null : i)} className="bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-emerald-500/30 transition-all flex flex-col gap-3">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${style.bg} ${style.border}`}>
                                            {style.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center gap-2">
                                                <h4 className="font-bold text-white text-base truncate">{p.title}</h4>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${style.color} ${style.bg}`}>
                                                    {p.difficulty}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 line-clamp-2 mt-1">{p.description}</p>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-all shrink-0 ${expandedProjectId === i ? 'rotate-180' : ''}`} />
                                    </div>
                                    {expandedProjectId === i && (
                                        <div className="mt-4 pt-4 border-t border-slate-800/50 animate-in slide-in-from-top-1">
                                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Missing Components:</h5>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {p.missingComponents.map((comp, compIdx) => (
                                                    <span key={compIdx} className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full border border-slate-700">
                                                        {comp}
                                                    </span>
                                                ))}
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); handleViewGuide(p, 'inventory'); }} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                                                <Wrench className="w-3 h-3" /> View Build Steps
                                            </button>
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    )}
                 </div>
            </div>
        </div>
      );
  }

  if (view === 'explore') {
      return (
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4"><button onClick={() => setView('landing')} className="p-2 bg-slate-800 rounded-lg text-slate-400"><ArrowLeft className="w-5 h-5" /></button><h2 className="text-xl md:text-2xl font-bold text-white">Explore Projects</h2></div>
                <button onClick={() => fetchRecommended(true)} className="p-2 bg-slate-800 rounded-lg"><RefreshCw className={`w-4 h-4 text-slate-400 ${loadingRecommended ? 'animate-spin' : ''}`} /></button>
            </div>
            {loadingRecommended ? <Loader2 className="w-8 h-8 animate-spin mx-auto mt-20 text-blue-500" /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                    {recommendedProjects.map((p, i) => {
                        const style = getDifficultyStyle(p.difficulty);
                        return (
                            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
                                <div className="flex justify-between items-center"><span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${style.color} ${style.bg}`}>{p.difficulty}</span></div>
                                <h4 className="font-bold text-white text-base leading-snug">{p.title}</h4>
                                <p className="text-[11px] text-slate-400 line-clamp-3 mb-2">{p.description}</p>
                                <button onClick={() => handleViewGuide(p, 'recommended')} className="mt-auto py-2 bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2">{loadingGuideTitle === p.title ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wrench className="w-3 h-3" />} Build Guide</button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
      );
  }
  return null;
};

export default ProjectCreator;