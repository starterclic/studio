/**
 * Tri-State Switch - Da Vinci
 * Permet de basculer entre les modes Content, Design et Code
 *
 * Modes:
 * - Content: Édition de contenu (Keystatic CMS) - Pour CLIENT_EDITOR
 * - Design: Édition visuelle (modifications CSS, composants) - Pour CLIENT_EDITOR
 * - Code: Éditeur de code complet (VSCode-like) - Pour AGENCY_DEVELOPER uniquement
 */

import { useStore } from '@nanostores/react';
import { atom } from 'nanostores';
import { classNames } from '~/utils/classNames';

export type WorkspaceMode = 'content' | 'design' | 'code';

// Store pour le mode workspace actuel
export const workspaceModeStore = atom<WorkspaceMode>('content');

interface TriStateSwitchProps {
  /**
   * Rôle de l'utilisateur pour déterminer les modes disponibles
   * - CLIENT_EDITOR: Content + Design
   * - AGENCY_DEVELOPER: Content + Design + Code
   * - AGENCY_ADMIN: Content + Design + Code
   */
  userRole?: 'CLIENT_EDITOR' | 'AGENCY_DEVELOPER' | 'AGENCY_ADMIN' | 'SUPER_ADMIN';
}

export function TriStateSwitch({ userRole = 'CLIENT_EDITOR' }: TriStateSwitchProps) {
  const mode = useStore(workspaceModeStore);

  // Déterminer si le mode Code est accessible
  const hasCodeAccess = userRole === 'AGENCY_DEVELOPER' || userRole === 'AGENCY_ADMIN' || userRole === 'SUPER_ADMIN';

  const setMode = (newMode: WorkspaceMode) => {
    // Empêcher l'accès au mode Code si l'utilisateur n'a pas les droits
    if (newMode === 'code' && !hasCodeAccess) {
      return;
    }

    workspaceModeStore.set(newMode);
  };

  return (
    <div className="flex items-center gap-1 bg-bolt-elements-background-depth-2 p-1 rounded-lg border border-bolt-elements-borderColor">
      {/* Content Mode */}
      <button
        onClick={() => setMode('content')}
        className={classNames(
          'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          'flex items-center gap-1.5',
          mode === 'content'
            ? 'bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary shadow-sm'
            : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3'
        )}
        title="Edit content with Keystatic CMS"
      >
        <div className="i-ph:article text-lg" />
        <span>Content</span>
      </button>

      {/* Design Mode */}
      <button
        onClick={() => setMode('design')}
        className={classNames(
          'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          'flex items-center gap-1.5',
          mode === 'design'
            ? 'bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary shadow-sm'
            : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3'
        )}
        title="Visual design editor (CSS, components)"
      >
        <div className="i-ph:palette text-lg" />
        <span>Design</span>
      </button>

      {/* Code Mode - Only for Developers */}
      {hasCodeAccess && (
        <button
          onClick={() => setMode('code')}
          className={classNames(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            'flex items-center gap-1.5',
            mode === 'code'
              ? 'bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary shadow-sm'
              : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3'
          )}
          title="Full code editor (developers only)"
        >
          <div className="i-ph:code text-lg" />
          <span>Code</span>
        </button>
      )}

      {/* Lock icon pour indiquer que le mode Code est restreint */}
      {!hasCodeAccess && (
        <div
          className="px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 text-bolt-elements-textTertiary cursor-not-allowed opacity-50"
          title="Code mode requires developer access"
        >
          <div className="i-ph:lock text-lg" />
          <span>Code</span>
        </div>
      )}
    </div>
  );
}

/**
 * Hook pour utiliser le mode workspace actuel
 */
export function useWorkspaceMode() {
  const mode = useStore(workspaceModeStore);

  return {
    mode,
    isContentMode: mode === 'content',
    isDesignMode: mode === 'design',
    isCodeMode: mode === 'code',
    setMode: (newMode: WorkspaceMode) => workspaceModeStore.set(newMode),
  };
}
