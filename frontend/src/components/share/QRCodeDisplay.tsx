import React, { useState } from 'react';
import { QrCode, Copy, Check, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { Modal } from '../common/Modal';

interface QRCodeDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareUrl: string;
  qrDataUrl: string;
}

export const QRCodeDisplayModal: React.FC<QRCodeDisplayModalProps> = ({
  isOpen,
  onClose,
  title,
  shareUrl,
  qrDataUrl,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-share-${title.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share QR Code" maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center space-y-4 py-2">
        {/* Title */}
        <div>
          <h3 className="text-base font-bold text-white truncate max-w-[320px]">
            {title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Scan this QR code with any smartphone camera to open the link
          </p>
        </div>

        {/* QR Code Frame */}
        <div className="relative p-4 bg-white rounded-2xl shadow-2xl border-4 border-brand-500/30 group">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Share QR Code"
              className="w-56 h-56 object-contain rounded-lg"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-lg">
              <QrCode className="w-16 h-16 text-slate-400 animate-pulse" />
            </div>
          )}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-slate-900 border border-brand-500/40 rounded-full text-[10px] font-bold text-brand-300 flex items-center gap-1 shadow-md">
            <ShieldCheck className="w-3 h-3 text-brand-400" />
            <span>Encrypted Share</span>
          </div>
        </div>

        {/* Share URL Box */}
        <div className="w-full flex items-center gap-2 p-2 bg-slate-950/80 rounded-xl border border-slate-800 text-xs mt-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent text-slate-300 px-2 py-1 outline-none truncate font-mono text-[11px]"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold transition active:scale-95 text-xs shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="w-full grid grid-cols-2 gap-2.5 pt-2">
          <button
            onClick={handleDownloadQR}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition active:scale-95 border border-white/5"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download QR</span>
          </button>

          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition active:scale-95 border border-white/5"
          >
            <ExternalLink className="w-4 h-4 text-emerald-400" />
            <span>Open Link</span>
          </a>
        </div>
      </div>
    </Modal>
  );
};
