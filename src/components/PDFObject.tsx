
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
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      <iframe 
        src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} 
        className="w-full h-full"
        title="PDF Viewer"
        frameBorder="0"
      />
    </div>
  );
};
