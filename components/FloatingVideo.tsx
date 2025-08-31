import React, { useRef, useState, useCallback, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { usePinchToZoom } from '../hooks/usePinchToZoom';

interface FloatingVideoProps {
  stream: MediaStream | null;
}

const ResizeIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <line x1="18" y1="18" x2="18" y2="18" strokeWidth={3} strokeLinecap="round" />
      <line x1="14" y1="18" x2="14" y2="18" strokeWidth={3} strokeLinecap="round" />
      <line x1="18" y1="14" x2="18" y2="14" strokeWidth={3} strokeLinecap="round" />
    </svg>
);


const FloatingVideo: React.FC<FloatingVideoProps> = ({ stream }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const interactionStartRef = useRef({
      x: 0, y: 0, // mouse position
      posX: 0, posY: 0, // element position
      width: 0, height: 0 // element size
  });

  const { zoom, onTouchStart, onTouchMove, onTouchEnd, isPinching } = usePinchToZoom();
  
  const updateInitialState = useCallback(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const safeMargin = 16;

      const initialWidth = Math.min(vw * 0.7, 1280);
      const initialHeight = initialWidth * (9 / 16);

      const initialX = Math.max(safeMargin, (vw - initialWidth) / 2);
      const initialY = Math.max(safeMargin, (vh - initialHeight) / 2);
      
      setSize({ width: initialWidth, height: initialHeight });
      setPosition({ x: initialX, y: initialY });
  }, []);

  useEffect(() => {
    updateInitialState();
    window.addEventListener('resize', updateInitialState);
    return () => window.removeEventListener('resize', updateInitialState);
  }, [updateInitialState]);

  const handlePointerDownDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).dataset.resizeHandle) return;
    
    e.preventDefault();
    setIsDragging(true);
    interactionStartRef.current = { ...interactionStartRef.current, x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerDownResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    interactionStartRef.current = { ...interactionStartRef.current, x: e.clientX, y: e.clientY, width: size.width, height: size.height };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [size]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging && !isResizing) return;
    e.preventDefault();
    
    if (isDragging) {
      const dx = e.clientX - interactionStartRef.current.x;
      const dy = e.clientY - interactionStartRef.current.y;
      setPosition({ 
        x: interactionStartRef.current.posX + dx, 
        y: interactionStartRef.current.posY + dy
      });
    }
    if (isResizing) {
      const dx = e.clientX - interactionStartRef.current.x;
      
      const newWidth = Math.max(320, interactionStartRef.current.width + dx);
      const newHeight = newWidth * (9 / 16); // Maintain 16:9 aspect ratio

      setSize({ width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging || isResizing) {
        e.preventDefault();
        setIsDragging(false);
        setIsResizing(false);
        if ((e.target as HTMLElement).hasPointerCapture(e.pointerId)) {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        }
    }
  }, [isDragging, isResizing]);
  
  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDownDrag}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp} // End drag/resize if pointer leaves window
      className="absolute bg-black rounded-lg shadow-2xl border-2 border-indigo-500/50 touch-none overflow-hidden select-none"
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      <div className="w-full h-full" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <VideoPlayer 
          ref={videoRef} 
          stream={stream} 
          muted={false} 
          style={{ transform: `scale(${zoom})`, transition: isPinching ? 'none' : 'transform 0.1s linear' }}
        />
      </div>
      <div 
        data-resize-handle="true"
        onPointerDown={handlePointerDownResize}
        className="absolute bottom-0 right-0 w-8 h-8 flex items-end justify-end p-1 cursor-se-resize touch-none"
        title="Resize"
      >
        <ResizeIcon className="w-4 h-4 text-white/40" />
      </div>
    </div>
  );
};

export default FloatingVideo;