/**
 * Panel Resizer Component
 *
 * Draggable divider between panels for resizing
 */

import { useState, useRef, useEffect } from 'react';

interface PanelResizerProps {
  orientation: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
}

export function PanelResizer({ orientation, onResize }: PanelResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef(0);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta =
        orientation === 'vertical'
          ? ((e.clientX - startPosRef.current) / window.innerWidth) * 100
          : ((e.clientY - startPosRef.current) / window.innerHeight) * 100;

      onResize(delta);
      startPosRef.current = orientation === 'vertical' ? e.clientX : e.clientY;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, orientation, onResize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = orientation === 'vertical' ? e.clientX : e.clientY;
    document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div
      className={`
        relative group
        ${orientation === 'vertical' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}
        ${isDragging ? 'bg-blue-500' : 'bg-gray-800 hover:bg-gray-700'}
        transition-colors
      `}
      onMouseDown={handleMouseDown}
    >
      {/* Visual indicator */}
      <div
        className={`
          absolute
          ${orientation === 'vertical' ? 'left-0 top-1/2 -translate-y-1/2 w-full h-12' : 'top-0 left-1/2 -translate-x-1/2 h-full w-12'}
          flex items-center justify-center
          opacity-0 group-hover:opacity-100 transition-opacity
        `}
      >
        <div
          className={`
            bg-gray-700 rounded
            ${orientation === 'vertical' ? 'w-1 h-8' : 'h-1 w-8'}
          `}
        />
      </div>
    </div>
  );
}
