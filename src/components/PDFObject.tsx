
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";

interface PDFObjectProps {
  url: string;
}

export const PDFObject = ({ url }: PDFObjectProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const isMobile = useIsMobile();
  const [key, setKey] = useState(url);

  // Reset loading state when URL changes
  useEffect(() => {
    setIsLoading(true);
    setLoadProgress(0);
    setKey(url); // Force iframe remount
  }, [url]);

  useEffect(() => {
    if (containerRef.current) {
      setHeight(containerRef.current.clientHeight);
    }

    const handleResize = () => {
      if (containerRef.current) {
        setHeight(containerRef.current.clientHeight);
      }
    };

    // Start the loading animation
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 95) {
        clearInterval(interval);
      } else {
        setLoadProgress(Math.min(progress, 95));
      }
    }, 300);

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, [url]); // Rerun effect when URL changes

  // Process the URL for proper embedding
  let pdfUrl = url;
  
  // Handle Google Docs links
  if (url.includes('docs.google.com/document')) {
    // This format works better for embedding Google Docs
    pdfUrl = url.replace(/\/edit.*$/, '/preview');
  }
  // Handle Google Drive PDF links
  else if (url.includes('drive.google.com/file/d/')) {
    // Extract file ID from Google Drive URL
    const fileIdMatch = url.match(/\/d\/([^\/]+)\//);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      // Format for embedding: https://drive.google.com/file/d/FILE_ID/preview
      pdfUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }

  const handleIframeLoad = () => {
    setLoadProgress(100);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-xs flex flex-col items-center gap-4">
            <div className="text-center mb-2">
              <h3 className="text-lg font-semibold">Loading Resume</h3>
              <p className="text-sm text-muted-foreground">Please wait while we prepare the document</p>
            </div>
            
            <div className="w-full">
              <Progress value={loadProgress} className="h-2 w-full" />
              <p className="text-xs text-muted-foreground mt-1 text-right">{Math.round(loadProgress)}%</p>
            </div>
            
            <Skeleton className="w-full h-32" />
            <div className="flex flex-col gap-2 w-full">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-5/6 h-4" />
            </div>
          </div>
        </div>
      )}
      
      <iframe 
        key={key} 
        src={pdfUrl}
        className="w-full h-full border-0"
        title="PDF Viewer"
        frameBorder="0"
        allowFullScreen
        onLoad={handleIframeLoad}
        style={{ 
          height: '100%',
          transform: 'none' // Ensures no scaling is applied on mobile
        }}
      />
    </div>
  );
};
