import React, { useState } from 'react';
import { X, UploadCloud, File, AlertCircle, Loader2 } from 'lucide-react';
import { uploadBidderPackage, uploadDocuments } from '../api/client';
import { UploadPackageResponse } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  tenderId?: string;
  bidderId?: string;
  onClose: () => void;
  onUploadComplete: (result: UploadPackageResponse) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  tenderId,
  bidderId,
  onClose,
  onUploadComplete,
}) => {
  const [declaredName, setDeclaredName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError('Please select at least one PDF filing or ZIP package.');
      return;
    }
    if (tenderId && !declaredName.trim()) {
      setError('Declared Bidder Legal Name is required.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let res: UploadPackageResponse;
      if (tenderId) {
        res = await uploadBidderPackage(tenderId, declaredName.trim(), selectedFiles);
      } else if (bidderId) {
        res = await uploadDocuments(bidderId, selectedFiles);
      } else {
        throw new Error('Neither tenderId nor bidderId was provided.');
      }

      onUploadComplete(res);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Document upload and safe ingestion failed.');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {tenderId ? 'Upload Bidder Submission Package' : 'Upload Additional Filings'}
              </h3>
              <p className="text-xs text-slate-400">
                Safe ingestion with SHA-256 deduplication and zip-bomb protection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          {tenderId && (
            <div>
              <label className="block font-medium text-slate-300 mb-1">Declared Bidder Name *</label>
              <input
                type="text"
                required
                value={declaredName}
                onChange={(e) => setDeclaredName(e.target.value)}
                placeholder="e.g. Apex Industrial Solutions Private Limited"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Select PDF Documents or ZIP Package *
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-sky-500 bg-sky-500/10'
                  : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/60'
              }`}
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <UploadCloud className="w-8 h-8 text-sky-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-200">
                Drag & drop files here, or <span className="text-sky-400 underline">browse</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports PDF, scanned filings, or compressed ZIP archive (Max 100 MB decompressed)
              </p>
              <input
                id="file-upload-input"
                type="file"
                multiple
                accept=".pdf,.zip,application/pdf,application/zip"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider block">
                Selected Filings ({selectedFiles.length})
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <File className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="text-slate-200 truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({formatSize(file.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || selectedFiles.length === 0}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Ingesting Package...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Start Pipeline</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
