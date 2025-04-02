
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

  // Convert Google Doc URLs to PDF if needed
  const pdfUrl = url.includes('docs.google.com/document') 
    ? url.replace('/edit?usp=sharing', '/export?format=pdf')
    : url;

  return (
    <div ref={containerRef} className="w-full h-full">
      <object
        data={pdfUrl}
        type="application/pdf"
        className="w-full h-full"
      >
        <p>Your browser does not support PDFs. 
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">Click here to download the PDF</a>
        </p>
      </object>
    </div>
  );
};
