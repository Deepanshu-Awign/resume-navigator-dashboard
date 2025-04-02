
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

  // Process the URL for proper embedding
  let pdfUrl = url;
  if (url.includes('docs.google.com/document')) {
    // This format works better for embedding Google Docs
    pdfUrl = url.replace(/\/edit.*$/, '/preview');
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <iframe 
        src={pdfUrl}
        className="w-full h-full border-0"
        title="PDF Viewer"
        frameBorder="0"
        allowFullScreen
      />
    </div>
  );
};
