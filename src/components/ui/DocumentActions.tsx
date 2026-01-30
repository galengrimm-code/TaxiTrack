'use client';

import { useState } from 'react';
import { Download, Share2, Printer, Check, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface DocumentActionsProps {
  title: string;
  documentId: string;
  onPrint?: () => void;
  getShareData?: () => { title: string; text: string; url?: string };
}

export function DocumentActions({ title, documentId, onPrint, getShareData }: DocumentActionsProps) {
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      return;
    }

    setSharing(true);
    try {
      const shareData = getShareData?.() || {
        title: title,
        text: `${title} - ${documentId}`,
        url: window.location.href,
      };
      await navigator.share(shareData);
    } catch (err) {
      // User cancelled or error
      console.log('Share cancelled or failed:', err);
    } finally {
      setSharing(false);
    }
  };

  const handleDownloadPDF = () => {
    // Trigger print dialog which allows saving as PDF
    window.print();
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Print / Download PDF */}
      <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="flex-1 sm:flex-none">
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">PDF</span>
      </Button>

      {/* Print */}
      <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 sm:flex-none print:hidden">
        <Printer className="w-4 h-4" />
        <span className="hidden sm:inline">Print</span>
      </Button>

      {/* Share */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        disabled={sharing}
        className="flex-1 sm:flex-none"
      >
        {sharing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : shared ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Share2 className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">{shared ? 'Copied!' : 'Share'}</span>
      </Button>
    </div>
  );
}

// Printable document wrapper with proper styling
export function PrintableDocument({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`printable-document ${className}`}>
      {children}
      <style jsx global>{`
        @media print {
          /* Hide ALL non-printable elements */
          .print\\:hidden,
          nav,
          aside,
          header,
          .no-print,
          [class*="fixed"],
          [class*="lg\\:hidden"],
          button,
          input,
          .safe-area-bottom {
            display: none !important;
          }

          /* Hide everything except printable document */
          body > * {
            display: none !important;
          }

          body {
            display: block !important;
          }

          /* Show printable document */
          .printable-document,
          .printable-document * {
            display: block !important;
            visibility: visible !important;
          }

          .printable-document {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 0.25in !important;
            margin: 0 !important;
            z-index: 99999 !important;
          }

          /* Fix table display */
          .printable-document table,
          .printable-document thead,
          .printable-document tbody,
          .printable-document tr,
          .printable-document th,
          .printable-document td {
            display: revert !important;
          }

          .printable-document .flex {
            display: flex !important;
          }

          .printable-document .grid {
            display: grid !important;
          }

          .printable-document .hidden {
            display: none !important;
          }

          .printable-document .sm\\:table-cell {
            display: table-cell !important;
          }

          /* Reset page margins */
          @page {
            margin: 0.5in;
            size: letter;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
