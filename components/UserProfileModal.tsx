import React from 'react';
import { UserProfile } from '../types';
import { X, User, Mail, GraduationCap, Briefcase, MapPin, Target, Zap, Clock, ShieldCheck, Edit2 } from 'lucide-react';

interface UserProfileModalProps {
  user: UserProfile;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative relative flex-shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-6 sm:px-10 pb-10 flex-1 overflow-y-auto">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-16 sm:-mt-12 mb-8 relative">
             <div className="relative">
                {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt={user.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-slate-900 object-cover shadow-xl bg-slate-800" />
                ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl border-4 border-slate-900 flex items-center justify-center shadow-xl">
                        <span className="text-4xl sm:text-5xl font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                )}
                {user.role === 'admin' && (
                    <div className="absolute -bottom-2 -right-2 bg-indigo-500 text-white p-1.5 rounded-full border-2 border-slate-900" title="Admin User">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                )}
             </div>

             <div className="flex-1 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white font-sans tracking-tight">{user.name}</h1>
                    <div className="flex items-center gap-3 mt-1.5 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm font-medium">{user.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 text-sm font-bold text-blue-400 shadow-inner">
                    <User className="w-4 h-4" />
                    <span className="uppercase tracking-wider text-xs">{user.role}</span>
                  </div>
                </div>
             </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Academic & Professional */}
            <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700/50">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-700/50 pb-2">Background</h3>
              <div className="space-y-4">
                {user.university && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg text-indigo-400">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">University / Organization</p>
                      <p className="text-sm font-medium text-slate-200">{user.university}</p>
                    </div>
                  </div>
                )}
                {user.domain && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Domain / Expertise</p>
                      <p className="text-sm font-medium text-slate-200">{user.domain}</p>
                    </div>
                  </div>
                )}
                 {user.age && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg text-amber-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Age</p>
                      <p className="text-sm font-medium text-slate-200">{user.age}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Interests */}
            <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700/50">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-700/50 pb-2">Skills & Interests</h3>
              <div className="flex items-start gap-3 mb-4 text-orange-400">
                 <Zap className="w-5 h-5 mt-0.5" />
                 <div className="flex-1 flex flex-wrap gap-2">
                    {user.technicalInterests && user.technicalInterests.length > 0 ? (
                        user.technicalInterests.map((interest, idx) => (
                            <span key={idx} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-300">
                                {interest}
                            </span>
                        ))
                    ) : (
                        <span className="text-xs text-slate-500 italic">No technical interests specified</span>
                    )}
                 </div>
              </div>
              
              {user.usageContext && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                   <p className="text-xs text-slate-500 mb-1">Primary Usage Context</p>
                   <p className="text-sm text-slate-300">{user.usageContext}</p>
                </div>
              )}
            </div>

            {/* Engineer Summary or Bio */}
            {(user.bio || user.engineeringSummary) && (
              <div className="md:col-span-2 bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-700/50 pb-2">
                    {user.engineeringSummary ? "Engineering Profile" : "About Me"}
                 </h3>
                 <div className="flex gap-4">
                    <div className="hidden sm:block p-3 bg-slate-800 rounded-xl text-blue-400 self-start border border-slate-700">
                       <Target className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        {user.engineeringSummary || user.bio}
                    </p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
