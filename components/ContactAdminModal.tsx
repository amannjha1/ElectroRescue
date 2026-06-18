
import React, { useState } from 'react';
import { UserProfile, ProjectIdea, ProjectHelpRequest } from '../types';
import { X, Send, PlusCircle, MessageCircle, Loader2, CheckCircle2, AlertCircle, Sparkles, Wrench, ArrowLeft } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { sendGeneralEmail } from '../services/emailService';

interface ContactAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  currentProject?: ProjectIdea | null; // Optional: If the user is asking help for a specific project
}

const ADMIN_EMAIL = 'electrorescuehelp@gmail.com';

const ContactAdminModal: React.FC<ContactAdminModalProps> = ({ isOpen, onClose, user, currentProject }) => {
  const [activeView, setActiveView] = useState<'selection' | 'request-project-form' | 'help-with-project-form'>('selection');
  const [queryText, setQueryText] = useState('');
  const [projectTitle, setProjectTitle] = useState(''); // Only for 'request-project-form'
  const [isKitRequest, setIsKitRequest] = useState(false); // New state for kit request
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requestType = activeView === 'request-project-form' ? 'request-project-kit' : 'help-with-project';
    
    if (!queryText.trim() && (requestType !== 'request-project-kit' || !projectTitle.trim())) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const newRequest: ProjectHelpRequest = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        type: requestType,
        timestamp: Date.now(),
        queryText: queryText.trim(),
        status: 'pending',
      };

      if (requestType === 'help-with-project' && currentProject) {
        newRequest.projectTitle = currentProject.title;
        newRequest.projectDescription = currentProject.description;
      } else if (requestType === 'request-project-kit' && projectTitle.trim()) {
        newRequest.projectTitle = projectTitle.trim();
        newRequest.isKitRequest = isKitRequest; // Set the kit request flag
      }

      await addDoc(collection(db, "project_help_requests"), newRequest);

      // Notify admin via email
      let emailSubject = '';
      let emailBody = '';
      if (requestType === 'request-project-kit') {
        emailSubject = `New Project Kit Request from ${user.name}`;
        emailBody = `User: ${user.name} (${user.email})\n` +
          `Type: Project Kit Request\n` +
          (newRequest.projectTitle ? `Project Idea: ${newRequest.projectTitle}\n` : '') +
          `Query: ${newRequest.queryText}\n` +
          `Kit Requested: ${newRequest.isKitRequest ? 'Yes' : 'No'}\n\n` +
          `Please check the "Requested Products" > "Project Requests" section in the Admin Panel.`;
      } else { // help-with-project
        emailSubject = `New Project Help Query from ${user.name}`;
        emailBody = `User: ${user.name} (${user.email})\n` +
          `Type: Help with Existing Project\n` +
          (newRequest.projectTitle ? `Project Title: ${newRequest.projectTitle}\n` : '') +
          `Query: ${newRequest.queryText}\n\n` +
          `Please check the "Requested Products" > "Project Requests" section in the Admin Panel.`;
      }


      await sendGeneralEmail(
        ADMIN_EMAIL,
        emailSubject,
        emailBody
      );

      // Email the user acknowledging the request
      await sendGeneralEmail(
        user.email,
        "Request Received - ER-ResQ",
        `Hello ${user.name},\n\nWe have received your project component/kit request.\n\nOur team will review your submission and contact you shortly.`,
        "template_nt1tje2"
      );

      setSubmitStatus('success');
      setQueryText('');
      setProjectTitle(''); 
      setIsKitRequest(false); // Reset kit request flag
      setTimeout(onClose, 2000); // Close modal after success
    } catch (error) {
      console.error("Error submitting project help request:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'selection':
        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            <p className="text-slate-400 text-sm text-center mb-6">What kind of project assistance do you need?</p>
            <button
              onClick={() => { setActiveView('request-project-form'); setProjectTitle(''); setQueryText(''); setIsKitRequest(false); }}
              className="group w-full bg-slate-950 border border-slate-800 rounded-xl p-5 text-left hover:border-blue-500/50 hover:bg-slate-800 transition-all flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-600/20 transition-colors shrink-0">
                <Sparkles className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-base">Request a Project Kit</h4>
                <p className="text-slate-500 text-xs mt-1">Ask the admin to help provide a complete project kit.</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-slate-500 rotate-180 group-hover:text-white transition-colors" />
            </button>
            <button
              onClick={() => { setActiveView('help-with-project-form'); setQueryText(''); }}
              className="group w-full bg-slate-950 border border-slate-800 rounded-xl p-5 text-left hover:border-emerald-500/50 hover:bg-slate-800 transition-all flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-600/20 transition-colors shrink-0">
                <Wrench className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-base">Get Help with My Project</h4>
                <p className="text-slate-500 text-xs mt-1">Describe a specific challenge you're facing.</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-slate-500 rotate-180 group-hover:text-white transition-colors" />
            </button>
          </div>
        );
      case 'request-project-form':
        return (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
            <button type="button" onClick={() => setActiveView('selection')} className="text-slate-500 hover:text-white flex items-center gap-1 mb-4 text-xs font-bold transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Request a Project Kit</h3>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Project Idea / Title (Optional)</label>
            <input
              type="text"
              placeholder="E.g., 'Smart Home Sensor Kit', 'Robotic Arm Kit'"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
            />
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Describe the project you want</label>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white h-32 resize-none focus:border-blue-500 outline-none placeholder:text-slate-600"
              placeholder="I'd like a project kit that includes a microcontroller and a temperature sensor. The admin could help develop it from scratch."
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requestKitCheckbox"
                checked={isKitRequest}
                onChange={(e) => setIsKitRequest(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out bg-slate-800 border-slate-700 rounded focus:ring-blue-500"
              />
              <label htmlFor="requestKitCheckbox" className="text-sm text-slate-300 cursor-pointer">
                I want the whole components of this project
              </label>
            </div>
            {submitStatus === 'success' && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400 text-sm animate-in slide-in-from-top-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Project kit request sent successfully!
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Failed to send request. Please try again.
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting || (!queryText.trim() && !projectTitle.trim())}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-4"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Send Project Kit Request
            </button>
          </form>
        );
      case 'help-with-project-form':
        return (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
            <button type="button" onClick={() => setActiveView('selection')} className="text-slate-500 hover:text-white flex items-center gap-1 mb-4 text-xs font-bold transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Get Help with My Project</h3>
            {currentProject && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Current Project</p>
                <p className="text-white font-medium">{currentProject.title}</p>
              </div>
            )}
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">How can the Admin help you with this project?</label>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white h-32 resize-none focus:border-blue-500 outline-none placeholder:text-slate-600"
              placeholder="I'm stuck on the coding part for the display. Can you provide a snippet for an I2C LCD?"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
            />
            {submitStatus === 'success' && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400 text-sm animate-in slide-in-from-top-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Help request sent successfully!
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Failed to send request. Please try again.
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !queryText.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-4"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Send Help Request
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
        aria-label="Close modal"
        role="button"
        tabIndex={0}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 p-8 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[95vh]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Contact Admin</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-2"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content based on activeView */}
        {renderContent()}
      </div>
    </div>
  );
};

export default ContactAdminModal;