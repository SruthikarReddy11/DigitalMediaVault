import React, { useState } from 'react';
import {
  X,
  Download,
  Chrome,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  FolderDown,
  Layers,
} from 'lucide-react';

interface ExtensionInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtensionInstallModal: React.FC<ExtensionInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!isOpen) return null;

  const handleCopyChromeUrl = () => {
    navigator.clipboard.writeText('chrome://extensions');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleDownloadClick = () => {
    setDownloadStarted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-6 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 via-brand-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
              <Chrome className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  VaultXMedia Chrome Extension
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  1-Click Save
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Save products from Amazon, Flipkart, Myntra & Ajio with 1 click
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Hero Download Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-950 border border-indigo-500/20 shadow-inner flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Ready-to-Use Extension Package</span>
              </h4>
              <p className="text-xs text-slate-400">
                Lightweight Manifest V3 extension package with auto-duplicate protection.
              </p>
            </div>

            <a
              href="/vaultxmedia-extension.zip"
              download="vaultxmedia-extension.zip"
              onClick={handleDownloadClick}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-brand-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 active:scale-95 transition shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download (.ZIP)</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-black/30 rounded-md">~17 KB</span>
            </a>
          </div>

          {downloadStarted && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center gap-2 text-xs text-emerald-300 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Download started! Follow the 3 easy steps below to load it into Chrome.</span>
            </div>
          )}

          {/* 3 Step Installation Instructions */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              3-Step Installation Guide
            </h4>

            {/* Step 1 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                1
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-200">
                  Extract (Unzip) the downloaded file
                </p>
                <p className="text-[11.5px] text-slate-400 leading-relaxed">
                  Right-click <code className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 text-[10.5px]">vaultxmedia-extension.zip</code> and select <strong>"Extract All..."</strong> to uncompress the folder.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                2
              </div>
              <div className="space-y-1.5 flex-1">
                <p className="text-xs font-semibold text-slate-200">
                  Open Chrome Extensions & Enable Developer Mode
                </p>
                <p className="text-[11.5px] text-slate-400 leading-relaxed">
                  Navigate to <code className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 text-[10.5px]">chrome://extensions</code> in a new tab, then switch <strong>ON</strong> the <em>Developer mode</em> toggle in the top-right corner.
                </p>
                <button
                  type="button"
                  onClick={handleCopyChromeUrl}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">Copied to clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy chrome://extensions</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                3
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-200">
                  Click "Load unpacked" & select the unzipped folder
                </p>
                <p className="text-[11.5px] text-slate-400 leading-relaxed">
                  In the top-left of the Extensions page, click <strong>"Load unpacked"</strong> and select the extracted folder.
                </p>
              </div>
            </div>
          </div>

          {/* Supported Sites Pill Badges */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Supported Shopping Sites:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Meesho', 'Nykaa', 'Tata CLiQ', 'Croma'].map((store) => (
                <span
                  key={store}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-800/80 text-slate-300 rounded-lg border border-slate-700/60"
                >
                  {store}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            VaultXMedia v1.0.0 • Manifest V3
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
