
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Briefcase, GraduationCap, Target, Store, Home, LogOut, ShieldAlert, ChevronLeft, ChevronRight, Palette, Moon, Sun, MoreVertical, PenTool, ClipboardList } from 'lucide-react';
import UserProfileModal from './UserProfileModal';

interface DashboardSidebarProps {
  user: UserProfile;
  currentView: 'dashboard' | 'marketplace' | 'er-resq' | 'projects' | 'my-products';
  onNavigate: (view: 'dashboard' | 'marketplace' | 'er-resq' | 'projects' | 'my-products') => void;
  onLogout: () => void;
  onEditProfile: () => void;
  theme: string;
  setTheme: (theme: string) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const ADMIN_EMAIL = 'electrorescuehelp@gmail.com';
const APP_VERSION = 'v1.2.4-beta';

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ 
  user, 
  currentView, 
  onNavigate, 
  onLogout, 
  onEditProfile,
  theme,
  setTheme,
  isCollapsed,
  toggleCollapse
}) => {
  const isAdmin = user.email === ADMIN_EMAIL || user.role === 'Admin';
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  return (
    <div 
      className={`hidden md:flex bg-slate-900 border-r border-slate-800 flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'} flex-shrink-0 z-40`}
    >
      {/* Toggle Button */}
      <button 
        onClick={toggleCollapse}
        className="absolute -right-3 top-8 bg-slate-800 border border-slate-700 rounded-full p-1 text-slate-400 hover:text-white z-20 shadow-lg hover:scale-110 transition-transform"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Profile Header */}
      <div className={`border-b border-slate-800 bg-slate-900 relative group transition-all duration-300 ${isCollapsed ? 'p-4' : 'p-6'}`}>
        {!isCollapsed && (
          <button 
             onClick={onEditProfile}
             className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-all opacity-0 group-hover:opacity-100"
             title="Account Settings"
          >
              <MoreVertical className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col items-center text-center">
          <div className={`${isCollapsed ? 'w-10 h-10' : 'w-24 h-24'} rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 p-0.5 mb-3 shadow-lg shadow-blue-500/20 transition-all duration-300`}>
            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => setShowProfileModal(true)} title="View Profile">
                {user.profileImageUrl ? (
                   <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   <User className={`${isCollapsed ? 'w-5 h-5' : 'w-10 h-10'} text-white transition-all`} />
                )}
            </div>
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in duration-300 mt-2">
              <button 
                onClick={() => setShowProfileModal(true)}
                className="text-xl font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis px-2 max-w-[200px] hover:text-blue-400 transition-colors cursor-pointer"
                title="View Profile Details"
              >
                {user.name}
              </button>
              <div>
                <span className="text-xs px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 mt-1 inline-block">
                  {user.role || 'Student'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide flex flex-col">
        <button 
            onClick={() => onNavigate('dashboard')}
            title={isCollapsed ? "Analyser Home" : ""}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
            <Home className="w-5 h-5" />
            {!isCollapsed && <span className="font-medium animate-in fade-in">Analyser Home</span>}
        </button>

        {!isAdmin && (
            <button 
                onClick={() => onNavigate('my-products')}
                title={isCollapsed ? "My Product Status" : ""}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${currentView === 'my-products' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <ClipboardList className="w-5 h-5" />
                {!isCollapsed && <span className="font-medium animate-in fade-in">My Product Status</span>}
            </button>
        )}

        {/* Project Creator Button - Hidden for Admins */}
        {!isAdmin && (
            <button 
                onClick={() => onNavigate('projects')}
                title={isCollapsed ? "Project Creator" : ""}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${currentView === 'projects' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <PenTool className="w-5 h-5" />
                {!isCollapsed && <span className="font-medium animate-in fade-in">Project Creator</span>}
            </button>
        )}
        
        <button 
            onClick={() => onNavigate('marketplace')}
            title={isCollapsed ? "ResQ-Store" : ""}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${currentView === 'marketplace' ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
            <Store className="w-5 h-5" />
            {!isCollapsed && <span className="font-medium animate-in fade-in">ResQ-Store</span>}
        </button>

        {isAdmin && (
            <button 
                onClick={() => onNavigate('er-resq')}
                title={isCollapsed ? "Admin Panel" : ""}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${currentView === 'er-resq' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <ShieldAlert className="w-5 h-5" />
                {!isCollapsed && <span className="font-medium animate-in fade-in">ER-ResQ</span>}
            </button>
        )}

        <div className="mt-auto pt-4 pb-2 w-full">
            <button 
                onClick={onLogout}
                title={isCollapsed ? "Sign Out" : ""}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors`}
            >
                <LogOut className="w-5 h-5" />
                {!isCollapsed && <span className="font-medium animate-in fade-in">Sign Out</span>}
            </button>

            {/* Version Display */}
            <div className={`mt-4 text-center transition-all duration-300 ${isCollapsed ? 'opacity-0 h-0' : 'opacity-100'}`}>
                <span className="text-[10px] text-slate-700 font-mono tracking-wider">{APP_VERSION}</span>
            </div>
        </div>
      </div>

      {showProfileModal && (
        <UserProfileModal 
          user={user} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}
    </div>
  );
};

export default DashboardSidebar;
