
import { useRef, useCallback, useEffect } from 'react';

/**
 * A hook to make a component draggable using CSS transforms.
 * It uses pointer events to handle mouse, touch, and pen inputs uniformly.
 *
 * @param ref A React ref attached to the DOM element to be made draggable.
 */
export const useDraggable = (ref: React.RefObject<HTMLDivElement>) => {
  const posRef = useRef({ x: 0, y: 0 }); // Stores the current transform values
  const offsetRef = useRef({ x: 0, y: 0 }); // Stores the mouse offset at the start of a drag

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!ref.current) return;
    event.preventDefault();

    const newX = event.clientX - offsetRef.current.x;
    const newY = event.clientY - offsetRef.current.y;
    
    posRef.current = { x: newX, y: newY };
    ref.current.style.transform = `translate(${newX}px, ${newY}px)`;
  }, [ref]);

  const handlePointerUp = useCallback((event: PointerEvent) => {
    event.preventDefault();
    if (!ref.current) return;
    
    ref.current.releasePointerCapture(event.pointerId);
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    
    ref.current.style.cursor = 'move';
    document.body.style.userSelect = 'auto'; // Re-enable text selection
  }, [ref, handlePointerMove]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    // Do not initiate drag if the target is an interactive element like a button.
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    event.preventDefault();
    if (!ref.current) return;

    // Calculate the offset from the mouse position to the element's current transform origin
    offsetRef.current = {
      x: event.clientX - posRef.current.x,
      y: event.clientY - posRef.current.y,
    };

    ref.current.setPointerCapture(event.pointerId);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    ref.current.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none'; // Prevent text selection during drag
  }, [ref, handlePointerMove, handlePointerUp]);

  // Reset position on window resize to avoid the element being stuck off-screen
  useEffect(() => {
    const handleResize = () => {
        if(ref.current) {
            ref.current.style.transform = 'translate(0px, 0px)';
            posRef.current = { x: 0, y: 0 };
        }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [ref]);

  return { onPointerDown };
};
