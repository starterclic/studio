/**
 * API Route: User Details (Lecture, Mise à jour, Suppression)
 * GET /api/users/:id - Récupère un utilisateur
 * PUT /api/users/:id - Met à jour un utilisateur
 * DELETE /api/users/:id - Supprime un utilisateur
 */

import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { db, handlePrismaError } from '~/utils/db.server';

/**
 * GET /api/users/:id
 * Récupère les détails d'un utilisateur
 */
export const loader = async ({ params }: LoaderFunctionArgs) => {
  try {
    const { id } = params;

    if (!id) {
      return Response.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    });

    if (!user) {
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: user,
    });
  } catch (error) {
    const { status, message } = handlePrismaError(error);
    return Response.json(
      {
        success: false,
        error: message,
      },
      { status }
    );
  }
};

/**
 * PUT /api/users/:id - Mise à jour
 * DELETE /api/users/:id - Suppression
 */
export const action = async ({ params, request }: ActionFunctionArgs) => {
  try {
    const { id } = params;

    if (!id) {
      return Response.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // PUT - Mise à jour
    if (request.method === 'PUT') {
      const body = (await request.json()) as any;
      const { email, name, role, authentikId } = body;

      const user = await db.user.update({
        where: { id },
        data: {
          ...(email && { email: email.toLowerCase().trim() }),
          ...(name && { name: name.trim() }),
          ...(role && { role }),
          ...(authentikId !== undefined && { authentikId: authentikId?.trim() || null }),
        },
        include: {
          organization: true,
        },
      });

      return Response.json({
        success: true,
        data: user,
        message: 'User updated successfully',
      });
    }

    // DELETE - Suppression
    if (request.method === 'DELETE') {
      await db.user.delete({
        where: { id },
      });

      return Response.json({
        success: true,
        message: 'User deleted successfully',
      });
    }

    return Response.json(
      { success: false, error: 'Method not allowed' },
      { status: 405 }
    );
  } catch (error) {
    const { status, message } = handlePrismaError(error);
    return Response.json(
      {
        success: false,
        error: message,
      },
      { status }
    );
  }
};
