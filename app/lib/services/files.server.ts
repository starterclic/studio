/**
 * File Management Service (Server-side)
 *
 * Server-side file operations for persistence and API integration
 * Works in conjunction with the client-side virtual file system
 */

import { prisma } from '~/utils/db.server';
import type { FileNode } from './filesystem';

export interface FileRecord {
  id: string;
  path: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  projectId: string;
  userId: string;
  created: Date;
  modified: Date;
}

/**
 * Get all files for a project
 */
export async function getProjectFiles(
  projectId: string,
  userId: string
): Promise<FileNode[]> {
  try {
    const files = await prisma.file.findMany({
      where: {
        projectId,
        userId,
      },
      orderBy: {
        path: 'asc',
      },
    });

    return files.map((file) => ({
      id: file.id,
      name: file.name,
      type: file.type as 'file' | 'folder',
      path: file.path,
      content: file.content || undefined,
      language: file.language || undefined,
      created: file.created.getTime(),
      modified: file.modified.getTime(),
    }));
  } catch (error) {
    console.error('[Files Service] Error fetching files:', error);
    return [];
  }
}

/**
 * Get a single file by path
 */
export async function getFile(
  path: string,
  projectId: string,
  userId: string
): Promise<FileNode | null> {
  try {
    const file = await prisma.file.findFirst({
      where: {
        path,
        projectId,
        userId,
      },
    });

    if (!file) return null;

    return {
      id: file.id,
      name: file.name,
      type: file.type as 'file' | 'folder',
      path: file.path,
      content: file.content || undefined,
      language: file.language || undefined,
      created: file.created.getTime(),
      modified: file.modified.getTime(),
    };
  } catch (error) {
    console.error('[Files Service] Error fetching file:', error);
    return null;
  }
}

/**
 * Create a new file or folder
 */
export async function createFile(
  data: {
    path: string;
    name: string;
    type: 'file' | 'folder';
    content?: string;
    language?: string;
    projectId: string;
    userId: string;
  }
): Promise<FileNode> {
  const file = await prisma.file.create({
    data: {
      path: data.path,
      name: data.name,
      type: data.type,
      content: data.content,
      language: data.language,
      projectId: data.projectId,
      userId: data.userId,
      created: new Date(),
      modified: new Date(),
    },
  });

  return {
    id: file.id,
    name: file.name,
    type: file.type as 'file' | 'folder',
    path: file.path,
    content: file.content || undefined,
    language: file.language || undefined,
    created: file.created.getTime(),
    modified: file.modified.getTime(),
  };
}

/**
 * Update file content
 */
export async function updateFile(
  path: string,
  content: string,
  projectId: string,
  userId: string
): Promise<FileNode | null> {
  try {
    const file = await prisma.file.updateMany({
      where: {
        path,
        projectId,
        userId,
      },
      data: {
        content,
        modified: new Date(),
      },
    });

    if (file.count === 0) return null;

    // Fetch updated file
    return await getFile(path, projectId, userId);
  } catch (error) {
    console.error('[Files Service] Error updating file:', error);
    return null;
  }
}

/**
 * Delete a file or folder
 */
export async function deleteFile(
  path: string,
  projectId: string,
  userId: string
): Promise<boolean> {
  try {
    // Delete file and all children (if folder)
    await prisma.file.deleteMany({
      where: {
        OR: [
          { path, projectId, userId },
          { path: { startsWith: `${path}/` }, projectId, userId },
        ],
      },
    });

    return true;
  } catch (error) {
    console.error('[Files Service] Error deleting file:', error);
    return false;
  }
}

/**
 * Rename/move a file
 */
export async function renameFile(
  oldPath: string,
  newPath: string,
  projectId: string,
  userId: string
): Promise<FileNode | null> {
  try {
    const segments = newPath.split('/').filter(Boolean);
    const newName = segments[segments.length - 1];

    const file = await prisma.file.updateMany({
      where: {
        path: oldPath,
        projectId,
        userId,
      },
      data: {
        path: newPath,
        name: newName,
        modified: new Date(),
      },
    });

    if (file.count === 0) return null;

    return await getFile(newPath, projectId, userId);
  } catch (error) {
    console.error('[Files Service] Error renaming file:', error);
    return null;
  }
}

/**
 * Sync virtual filesystem to database
 * This can be called periodically or on specific events
 */
export async function syncFilesToDatabase(
  files: FileNode[],
  projectId: string,
  userId: string
): Promise<void> {
  try {
    // Delete existing files for this project
    await prisma.file.deleteMany({
      where: {
        projectId,
        userId,
      },
    });

    // Bulk create new files
    const fileRecords = files.map((file) => ({
      id: file.id,
      path: file.path,
      name: file.name,
      type: file.type,
      content: file.content,
      language: file.language,
      projectId,
      userId,
      created: new Date(file.created),
      modified: new Date(file.modified),
    }));

    await prisma.file.createMany({
      data: fileRecords,
      skipDuplicates: true,
    });

    console.log(`[Files Service] Synced ${files.length} files to database`);
  } catch (error) {
    console.error('[Files Service] Error syncing files:', error);
    throw error;
  }
}
