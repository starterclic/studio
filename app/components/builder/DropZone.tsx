/**
 * Drop Zone - Ultra Premium
 *
 * Visual drop zone for drag & drop
 * Shows where components can be dropped
 */

import { useDroppable } from '@dnd-kit/core';

interface DropZoneProps {
  parentId: string | null;
  order: number;
}

export function DropZone({ parentId, order }: DropZoneProps) {
  const id = `dropzone-${parentId || 'root'}-${order}`;

  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        transition-all duration-200 ease-out
        ${
          isOver
            ? 'h-24 opacity-100 my-4'
            : 'h-2 opacity-0 hover:opacity-50 hover:h-16 my-0'
        }
      `}
    >
      <div
        className={`
          h-full rounded-lg border-2 border-dashed transition-all duration-200
          ${
            isOver
              ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
              : 'border-gray-300 dark:border-gray-600 bg-gray-100/50 dark:bg-gray-800/50'
          }
        `}
      >
        {isOver && (
          <div className="h-full flex items-center justify-center">
            <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <svg className="w-5 h-5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Drop here
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
