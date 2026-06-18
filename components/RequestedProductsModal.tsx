
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { X, ShoppingBag, FolderCog } from 'lucide-react';
import ERResQ from './ERResQ'; // Reusing the existing ERResQ component for Store Orders
import ProjectHelpRequestsPanel from './ProjectHelpRequestsPanel'; // Import the new panel

interface RequestedProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

const RequestedProductsModal: React.FC<RequestedProductsModalProps> = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState<'store-orders' | 'project-requests'>('store-orders');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
        aria-label="Close modal"
        role="button"
        tabIndex={0}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-700 p-8 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[95vh]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Requested Products</h3>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-2"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('store-orders')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'store-orders' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <ShoppingBag className="w-3 h-3" /> Store Orders
          </button>
          <button
            onClick={() => setActiveTab('project-requests')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'project-requests' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <FolderCog className="w-3 h-3" /> Project Requests
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar -mx-4 -mb-4 p-4">
          {activeTab === 'store-orders' ? (
            <ERResQ user={user} isModalView={true} />
          ) : (
            <ProjectHelpRequestsPanel user={user} isModalView={true} />
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestedProductsModal;
