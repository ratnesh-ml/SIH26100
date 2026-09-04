import React, { useState, useRef } from 'react';
import { UploadCloud, File, Trash2, ShieldCheck } from 'lucide-react';
import { uploadBidderPackage, uploadDocuments } from '../api/client';
import { UploadPackageResponse } from '../types';
import { Modal, ErrorState } from './ui';

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
      title={tenderId ? 'Secure Bidder Ingestion Portal' : 'Upload Additional Statutory Filings'}
      description="Safe CAS ingestion with SHA-256 deduplication and zip-bomb decompression limits."
      icon={<UploadCloud className="w-5 h-5 text-[#0066cc]" />}
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
            <label htmlFor="declared-name-input" className="block font-semibold text-[#1d1d1f] mb-1">
              Declared Bidder Legal Name <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              id="declared-name-input"
              type="text"
              required
              value={declaredName}
              onChange={(e) => setDeclaredName(e.target.value)}
              placeholder="e.g. Apex Industrial Solutions Private Limited"
              className="w-full bg-[#f5f5f7] border border-[#e0e0e0] rounded-xl px-3.5 py-2.5 text-xs text-[#1d1d1f] placeholder-[#7a7a7a] focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] transition-colors"
            />
          </div>
        )}

        <div>
          <label className="block font-semibold text-[#1d1d1f] mb-1">
            Select PDF Documents or ZIP Package <span className="text-[#ba1a1a]">*</span>
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
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all outline-none ${
              isDragging
                ? 'border-[#0066cc] bg-[#0066cc]/5'
                : 'border-[#c1c6d6] hover:border-[#0066cc] bg-[#f5f5f7]'
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
            <div className="w-12 h-12 rounded-full bg-white border border-[#e0e0e0] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <UploadCloud className="w-6 h-6 text-[#0066cc]" aria-hidden="true" />
            </div>
            <p className="text-[#1d1d1f] font-semibold text-xs">
              Click to browse or drag & drop files here
            </p>
            <p className="text-[#7a7a7a] text-[11px] mt-1">
              Supports individual statutory PDF certificates or consolidated bidder ZIP archives
            </p>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            <div className="text-[11px] font-semibold text-[#7a7a7a] uppercase tracking-wider flex items-center justify-between">
              <span>Selected Files ({selectedFiles.length})</span>
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-[#ba1a1a] hover:underline text-[10px] font-medium cursor-pointer"
              >
                Clear all
              </button>
            </div>
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f]"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <File className="w-3.5 h-3.5 text-[#0066cc] shrink-0" aria-hidden="true" />
                  <span className="truncate font-mono text-xs">{file.name}</span>
                  <span className="text-[#7a7a7a] text-[10px] shrink-0 font-mono">
                    ({formatSize(file.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="text-[#7a7a7a] hover:text-[#ba1a1a] p-1 rounded transition-colors cursor-pointer"
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
        <div className="p-3 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] text-xs text-[#515154] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#248a3d] shrink-0" />
          <span>
            Uploaded documents are hashed with SHA-256 and stored immutably in content-addressable storage (CAS).
          </span>
        </div>

        <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#e0e0e0]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-[#e0e0e0] hover:bg-[#f5f5f7] text-[#515154] font-medium text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || selectedFiles.length === 0}
            className="px-5 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-none disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{uploading ? 'Ingesting Package...' : 'Upload & Ingest Package'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
