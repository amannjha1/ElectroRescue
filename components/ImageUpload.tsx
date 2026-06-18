import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Upload, ImageIcon, Loader2, Camera, Plus, FileImage } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (files: File[]) => void;
  isLoading: boolean;
  queueLength?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, isLoading, queueLength = 0 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (files.length > 0) {
        onImageSelect(files);
      }
    }
  }, [onImageSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageSelect(Array.from(e.target.files));
    }
    if (e.target) {
        e.target.value = '';
    }
  }, [onImageSelect]);

  const handleSelectImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleTakePhotoClick = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300
        min-h-[300px] flex flex-col items-center justify-center text-center p-8
        ${isDragging 
          ? 'border-blue-500 bg-blue-500/10' 
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
        }
        ${isLoading && queueLength === 0 ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        ref={cameraInputRef}
      />
      
      {(isLoading && queueLength === 0) ? (
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">Analyzing Circuitry...</h3>
            <p className="text-sm text-slate-400">Identifying components and assessing condition</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 w-full relative z-10">
          <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-blue-500/20' : 'bg-slate-700/50'}`}>
            {isDragging ? (
              <ImageIcon className="w-10 h-10 text-blue-400" />
            ) : queueLength > 0 ? (
              <div className="relative">
                 <FileImage className="w-10 h-10 text-emerald-400" />
                 <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {queueLength + (isLoading ? 1 : 0)}
                 </span>
              </div>
            ) : (
              <Upload className="w-10 h-10 text-slate-400" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-medium text-white">
              {isDragging ? 'Drop images to analyze' : 
               queueLength > 0 ? (isLoading ? `Analyzing 1 of ${queueLength + 1} PCBs...` : `${queueLength} PCBs queued`) : 
               'Upload PCB Images'}
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Drag and drop multiple PCB photos here or select an option below to queue them for scanning
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full max-w-xs mx-auto">
             <button onClick={handleSelectImageClick} className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
              {queueLength > 0 ? <Plus className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              {queueLength > 0 ? 'Add More' : 'Select Files'}
            </button>
            
            <button onClick={handleTakePhotoClick} className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
              {queueLength > 0 ? <Plus className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              {queueLength > 0 ? 'Take Another' : 'Take Photo'}
            </button>
          </div>
          <p className="text-xs text-slate-500 font-mono">Supports JPG, PNG, WEBP (Multiple allowed)</p>

          <div className="flex gap-4 mt-2">
            <span className="px-3 py-1 bg-slate-900 rounded border border-slate-700 text-xs text-slate-500 font-mono">
              COMPONENTS
            </span>
            <span className="px-3 py-1 bg-slate-900 rounded border border-slate-700 text-xs text-slate-500 font-mono">
              DAMAGE
            </span>
            <span className="px-3 py-1 bg-slate-900 rounded border border-slate-700 text-xs text-slate-500 font-mono">
              ₹ VALUATION
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;