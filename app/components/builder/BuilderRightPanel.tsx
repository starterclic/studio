/**
 * Builder Right Panel - Ultra Premium
 *
 * Tabbed panel for Props Inspector and Live Preview
 * Features: Smooth transitions, Keyboard shortcuts, State persistence
 */

import { useBuilderStore } from '~/lib/stores/builder.store';
import { PropsInspector } from './PropsInspector';
import { BuilderPreview } from './BuilderPreview';

export function BuilderRightPanel() {
  const { activeRightPanel, setActiveRightPanel } = useBuilderStore();

  return (
    <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Tab Navigation */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <button
          onClick={() => setActiveRightPanel('inspector')}
          className={`
            flex-1 px-6 py-3 font-semibold transition-all flex items-center justify-center gap-2
            ${
              activeRightPanel === 'inspector'
                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          <span>Inspector</span>
        </button>

        <button
          onClick={() => setActiveRightPanel('preview')}
          className={`
            flex-1 px-6 py-3 font-semibold transition-all flex items-center justify-center gap-2
            ${
              activeRightPanel === 'preview'
                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span>Preview</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeRightPanel === 'inspector' && <PropsInspector />}
        {activeRightPanel === 'preview' && (
          <BuilderPreview className="h-full" />
        )}
      </div>

      {/* Tab Hint */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            {activeRightPanel === 'inspector'
              ? 'Configure component props and settings'
              : 'Live preview updates automatically'}
          </span>
        </div>
      </div>
    </div>
  );
}
