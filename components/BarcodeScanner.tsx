'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { X, Camera, RefreshCw } from 'lucide-react';

interface BarcodeScannerProps {
    onScan: (code: string) => void;
    onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const codeReader = new BrowserMultiFormatReader();
        readerRef.current = codeReader;

        const startScanner = async () => {
            try {
                const videoInputDevices = await codeReader.listVideoInputDevices();
                if (videoInputDevices.length === 0) {
                    setError('কোন ক্যামেরা খুঁজে পাওয়া যায়নি।');
                    return;
                }

                // Use the back camera if available
                const backCamera = videoInputDevices.find(device =>
                    device.label.toLowerCase().includes('back') ||
                    device.label.toLowerCase().includes('rear')
                ) || videoInputDevices[0];

                codeReader.decodeFromVideoDevice(
                    backCamera.deviceId,
                    videoRef.current!,
                    (result, err) => {
                        if (result) {
                            onScan(result.getText());
                        }
                    }
                );
                setHasPermission(true);
            } catch (err) {
                console.error('Camera error:', err);
                setError('ক্যামেরা ব্যবহারের অনুমতি প্রয়োজন।');
                setHasPermission(false);
            }
        };

        startScanner();

        return () => {
            if (readerRef.current) {
                readerRef.current.reset();
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <Card className="w-full max-w-sm overflow-hidden bg-background">
                <div className="relative aspect-square w-full bg-black">
                    <video
                        ref={videoRef}
                        className="h-full w-full object-cover"
                    />
                    {/* Scanning Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="h-48 w-48 border-2 border-primary/50 rounded-lg relative">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary"></div>

                            {/* Scanline animation */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-primary/40 animate-scanline"></div>
                        </div>
                        <p className="mt-4 text-xs text-white bg-black/50 px-3 py-1 rounded-full">
                            বারকোডটি বক্সের ভেতরে ধরুন
                        </p>
                    </div>
                </div>

                <div className="p-4 flex flex-col gap-3">
                    {error && (
                        <p className="text-sm text-red-500 text-center font-medium">{error}</p>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={onClose}>
                            <X className="mr-2 h-4 w-4" /> বন্ধ করুন
                        </Button>
                        <Button className="flex-1" onClick={() => window.location.reload()}>
                            <RefreshCw className="mr-2 h-4 w-4" /> রিসেট
                        </Button>
                    </div>
                </div>
            </Card>

            <style jsx global>{`
        @keyframes scanline {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scanline {
          animation: scanline 2s linear infinite;
        }
      `}</style>
        </div>
    );
};

// Internal Card fallback to avoid dependency issues in this specific component if not exported
function Card({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={`border rounded-lg shadow-sm ${className}`}>{children}</div>;
}
