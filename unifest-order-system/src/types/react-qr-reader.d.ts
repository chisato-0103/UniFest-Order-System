declare module 'react-qr-reader' {
  import * as React from 'react';
  interface QrReaderProps {
    delay?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError?: (error: any) => void;
    onScan?: (data: string | null) => void;
    style?: React.CSSProperties;
    facingMode?: string;
    legacyMode?: boolean;
    showViewFinder?: boolean;
    className?: string;
  }
  const QrReader: React.FC<QrReaderProps>;
  export default QrReader;
}
