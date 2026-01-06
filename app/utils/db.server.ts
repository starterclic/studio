/**
 * Database Singleton - Da Vinci
 * Prisma Client singleton pour éviter les connexions multiples en développement
 *
 * @see https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton PrismaClient
 * - En production: crée une seule instance
 * - En développement: réutilise l'instance globale pour éviter les connexions multiples
 */
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

/**
 * Helper pour formatter les erreurs Prisma
 */
export function handlePrismaError(error: unknown): {
  status: number;
  message: string;
} {
  if (error instanceof Error) {
    // Erreur de connexion
    if (error.message.includes('P1001')) {
      return {
        status: 503,
        message: 'Database unavailable',
      };
    }

    // Erreur d'authentification
    if (error.message.includes('P1000')) {
      return {
        status: 500,
        message: 'Database authentication failed',
      };
    }

    // Contrainte unique violée
    if (error.message.includes('P2002')) {
      return {
        status: 409,
        message: 'Resource already exists',
      };
    }

    // Enregistrement non trouvé
    if (error.message.includes('P2025')) {
      return {
        status: 404,
        message: 'Resource not found',
      };
    }

    // Contrainte de clé étrangère violée
    if (error.message.includes('P2003')) {
      return {
        status: 400,
        message: 'Invalid reference',
      };
    }
  }

  return {
    status: 500,
    message: 'Internal server error',
  };
}
