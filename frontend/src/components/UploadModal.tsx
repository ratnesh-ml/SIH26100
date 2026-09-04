import React, { useState, useRef } from 'react';
import { UploadCloud, File, Trash2, ShieldCheck } from 'lucide-react';
import { uploadBidderPackage, uploadDocuments } from '../api/client';
import { UploadPackageResponse } from '../types';
import { Modal, Button, ErrorState } from './ui';

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

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setError('Please select at least one statutory PDF certificate or ZIP package.');
      return;
    }
    if (tenderId && !declaredName.trim()) {
      setError('Declared Bidder Legal Name is strictly required.');
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tenderId ? 'Upload Bidder Submission Package' : 'Upload Additional Statutory Filings'}
      description="Safe CAS ingestion with SHA-256 deduplication and zip-bomb decompression limits."
      icon={<UploadCloud className="w-5 h-5" />}
      maxWidth="lg"
    >
      {error && (
        <ErrorState
          message={error}
          onDismiss={() => setError(null)}
          className="mb-4"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {tenderId && (
          <div>
            <label htmlFor="declared-name-input" className="block font-semibold text-slate-200 mb-1">
              Declared Bidder Legal Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="declared-name-input"
              type="text"
              required
              value={declaredName}
              onChange={(e) => setDeclaredName(e.target.value)}
              placeholder="e.g. Apex Industrial Solutions Private Limited"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        )}

        <div>
          <label className="block font-semibold text-slate-200 mb-1">
            Select PDF Documents or ZIP Package <span className="text-rose-400">*</span>
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Upload files dropzone. Click to browse or drag and drop files here."
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              isDragging
                ? 'border-sky-400 bg-sky-950/30'
                : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.zip,application/pdf,application/zip"
              onChange={handleFileChange}
              className="hidden"
              tabIndex={-1}
            />
            <UploadCloud className="w-8 h-8 text-sky-400 mx-auto mb-2" aria-hidden="true" />
            <p className="text-slate-200 font-semibold text-xs">
              Click to browse or drag & drop files here
            </p>
            <p className="text-slate-400 text-[11px] mt-1">
              Supports individual statutory PDF certificates or consolidated bidder ZIP archives
            </p>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Selected Files ({selectedFiles.length})</span>
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-rose-400 hover:text-rose-300 text-[10px] font-normal cursor-pointer"
              >
                Clear all
              </button>
            </div>
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <File className="w-3.5 h-3.5 text-sky-400 shrink-0" aria-hidden="true" />
                  <span className="truncate font-mono text-xs">{file.name}</span>
                  <span className="text-slate-500 text-[10px] shrink-0 font-mono">
                    ({formatSize(file.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="text-slate-400 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                  title="Remove file"
                  aria-label={`Remove file ${file.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Security / Verification Badge */}
        <div className="p-2.5 rounded-lg bg-sky-950/20 border border-sky-900/40 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            Uploaded documents are hashed with SHA-256 and stored immutably in content-addressable storage (CAS).
          </span>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={uploading}
            disabled={selectedFiles.length === 0}
            leftIcon={<UploadCloud className="w-4 h-4" />}
          >
            Upload & Ingest Package
          </Button>
        </div>
      </form>
    </Modal>
  );
};
