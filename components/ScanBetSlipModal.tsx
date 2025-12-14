import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { createWorker } from 'tesseract.js';
import { X, Camera, Check, AlertTriangle, Upload, QrCode } from 'lucide-react';
import { BetSlipItem } from '../types';

interface ScanBetSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: BetSlipItem) => void;
}

export const ScanBetSlipModal: React.FC<ScanBetSlipModalProps> = ({ isOpen, onClose, onAddItem }) => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'qr' | 'ocr'>('qr');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen && mode === 'qr' && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scannerRef.current.render(onScanSuccess, onScanError);
    } else if (scannerRef.current && mode !== 'qr') {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen, mode]);

  const onScanSuccess = (decodedText: string) => {
    setScanResult(decodedText);
    setIsProcessing(true);
    setError(null);

    try {
      const parsedData = JSON.parse(decodedText);
      if (Array.isArray(parsedData)) {
        // Assume it's an array of BetSlipItem
        parsedData.forEach((item: any) => {
          if (item.id && item.matchUp && item.selection && item.odds && item.outcome) {
            const betItem: BetSlipItem = {
              id: item.id,
              matchId: item.matchId || `scanned_${Date.now()}`,
              matchUp: item.matchUp,
              selection: item.selection,
              odds: item.odds,
              outcome: item.outcome,
              timestamp: item.timestamp || Date.now(),
              confidence: item.confidence,
            };
            onAddItem(betItem);
          }
        });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError('Invalid QR code format. Expected array of bet items.');
      }
    } catch (err) {
      setError('Failed to parse QR code data. Please ensure it contains valid JSON.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onScanError = (errorMessage: string) => {
    // Ignore common scanning errors, only show real issues
    if (!errorMessage.includes('NotFoundException')) {
      console.warn('QR Scan error:', errorMessage);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setScanResult(null);

    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      setScanResult(text);
      parseBetSlipText(text);
    } catch (err) {
      setError('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseBetSlipText = (text: string) => {
    // Simple parser for bet slip text
    // Assumes format like: "Team A vs Team B - Home 2.0"
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const bets: BetSlipItem[] = [];

    lines.forEach((line, index) => {
      // Look for patterns
      const match = line.match(/^(.+?)\s*vs\s*(.+?)\s*-\s*(.+?)\s*(\d+\.?\d*)$/i);
      if (match) {
        const [, home, away, selection, oddsStr] = match;
        const odds = parseFloat(oddsStr);
        if (!isNaN(odds)) {
          let outcome: 'HOME' | 'DRAW' | 'AWAY' = 'DRAW';
          if (selection.toLowerCase().includes('home') || selection.toLowerCase().includes(home.toLowerCase())) {
            outcome = 'HOME';
          } else if (selection.toLowerCase().includes('away') || selection.toLowerCase().includes(away.toLowerCase())) {
            outcome = 'AWAY';
          }

          const betItem: BetSlipItem = {
            id: `ocr_${Date.now()}_${index}`,
            matchId: `ocr_match_${index}`,
            matchUp: `${home.trim()} vs ${away.trim()}`,
            selection: selection.trim(),
            odds: odds,
            outcome: outcome,
            timestamp: Date.now(),
          };
          bets.push(betItem);
        }
      }
    });

    if (bets.length > 0) {
      bets.forEach(bet => onAddItem(bet));
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setError('Could not extract bet information from the text. Please ensure the image is clear and follows the expected format.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1E1E1E] w-full max-w-md rounded-2xl border border-[#2C2C2C] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[#2C2C2C] flex items-center justify-between bg-[#121212]">
          <div className="flex items-center gap-2">
            <Camera size={20} className="text-[#00FFB2]" />
            <h3 className="font-condensed font-black text-lg uppercase text-white">Scan Bet Slip</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-[#2C2C2C]">
          <button
            onClick={() => setMode('qr')}
            className={`flex-1 py-3 px-4 text-sm font-bold uppercase flex items-center justify-center gap-2 transition-colors ${
              mode === 'qr' ? 'bg-[#00FFB2] text-black' : 'bg-[#1E1E1E] text-gray-400 hover:text-white'
            }`}
          >
            <QrCode size={16} />
            QR Code
          </button>
          <button
            onClick={() => setMode('ocr')}
            className={`flex-1 py-3 px-4 text-sm font-bold uppercase flex items-center justify-center gap-2 transition-colors ${
              mode === 'ocr' ? 'bg-[#00FFB2] text-black' : 'bg-[#1E1E1E] text-gray-400 hover:text-white'
            }`}
          >
            <Upload size={16} />
            Photo OCR
          </button>
        </div>

        <div className="p-4">
          {mode === 'qr' ? (
            <div id="qr-reader" className="w-full"></div>
          ) : (
            <div className="text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E1E1E] border border-[#2C2C2C] hover:border-[#00FFB2] rounded-lg cursor-pointer transition-colors"
              >
                <Upload size={16} />
                Choose Image
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Upload a photo of your bet slip for text extraction
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          {scanResult && !error && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
              <Check size={16} className="text-green-500" />
              <span className="text-sm text-green-400">
                {isProcessing ? 'Processing bet slip...' : 'Bet slip scanned successfully!'}
              </span>
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              {mode === 'qr'
                ? 'Point your camera at a QR code containing bet slip data'
                : 'Upload a clear photo of your bet slip for automatic text extraction'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};