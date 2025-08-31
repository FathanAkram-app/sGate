'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';

interface QRCodeProps {
  value: string;
  size?: number;
  showCopy?: boolean;
  label?: string;
}

export function QRCode({ value, size = 200, showCopy = true, label }: QRCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(value);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {label && (
        <p className="text-sm font-medium text-gray-700">{label}</p>
      )}
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          includeMargin={false}
        />
      </div>

      {showCopy && (
        <div className="w-full max-w-md">
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border">
            <code className="flex-1 text-sm font-mono text-gray-800 break-all">
              {value}
            </code>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-green-600 mt-1 text-center">
              Copied to clipboard!
            </p>
          )}
        </div>
      )}
    </div>
  );
}