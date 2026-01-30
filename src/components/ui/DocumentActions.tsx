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

// Generate PDF from the printable document element
async function generatePDF(filename: string): Promise<Blob> {
  // Dynamic import to avoid SSR issues
  const html2pdf = (await import('html2pdf.js')).default;

  const element = document.querySelector('.printable-document') as HTMLElement | null;
  if (!element) {
    throw new Error('No printable document found');
  }

  const opt = {
    margin: 0.5,
    filename: filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
  };

  // Generate PDF as blob
  const blob = await html2pdf().set(opt).from(element).outputPdf('blob');
  return blob;
}

export function DocumentActions({ title, documentId, onPrint, getShareData }: DocumentActionsProps) {
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const filename = `${title.replace(/\s+/g, '_')}.pdf`;
      const pdfBlob = await generatePDF(filename);
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      // Check if file sharing is supported
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: title,
          text: getShareData?.().text || `${title} - ${documentId}`,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } else {
        // Fallback: download the PDF instead
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch (err) {
      console.error('Share failed:', err);
      // If user cancelled, that's ok
    } finally {
      setSharing(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const filename = `${title.replace(/\s+/g, '_')}.pdf`;
      const pdfBlob = await generatePDF(filename);

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
      // Fallback to print dialog
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Download PDF */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadPDF}
        disabled={downloading}
        className="flex-1 sm:flex-none"
      >
        {downloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">{downloading ? 'Creating...' : 'PDF'}</span>
      </Button>

      {/* Print */}
      <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 sm:flex-none print:hidden">
        <Printer className="w-4 h-4" />
        <span className="hidden sm:inline">Print</span>
      </Button>

      {/* Share PDF */}
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
        <span className="hidden sm:inline">{shared ? 'Done!' : 'Share'}</span>
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
          .no-print,
          button,
          input,
          .safe-area-bottom {
            display: none !important;
          }

          /* Make html and body transparent to allow absolute positioning */
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide everything by default using visibility */
          body * {
            visibility: hidden;
          }

          /* Show printable document and all its children */
          .printable-document,
          .printable-document * {
            visibility: visible !important;
          }

          .printable-document {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Fix table display */
          .printable-document table {
            display: table !important;
          }
          .printable-document thead {
            display: table-header-group !important;
          }
          .printable-document tbody {
            display: table-row-group !important;
          }
          .printable-document tr {
            display: table-row !important;
          }
          .printable-document th,
          .printable-document td {
            display: table-cell !important;
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

          .printable-document .sm\\:hidden {
            display: none !important;
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
