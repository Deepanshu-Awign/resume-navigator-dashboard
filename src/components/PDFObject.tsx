
import { useEffect, useRef, useState } from "react";

interface PDFObjectProps {
  url: string;
}

export const PDFObject = ({ url }: PDFObjectProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    if (containerRef.current) {
      setHeight(containerRef.current.clientHeight);
    }

    const handleResize = () => {
      if (containerRef.current) {
        setHeight(containerRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use a direct PDF embed for better rendering
  return (
    <div ref={containerRef} className="w-full h-full">
      <iframe 
        src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
        className="w-full h-full border-0"
        title="PDF Viewer"
        frameBorder="0"
      />
    </div>
  );
};
