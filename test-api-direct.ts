/**
 * Test Direct des API Routes - Da Vinci
 * Teste les opérations CRUD sans démarrer le serveur Remix
 */

import { db } from './app/utils/db.server';

const TEMPLATE_ID = 'a12f886b-aad7-4971-b73a-14dda5aec6f4';

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║       Da Vinci - Test Direct des API Routes                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  let orgId: string;
  let userId: string;
  let projectId: string;

  try {
    // ===================================================================
    // ORGANIZATIONS
    // ===================================================================
    console.log('📦 TEST: Organizations\n');

    // 1. Créer une organisation
    console.log('→ Créer une organisation...');
    const org = await db.organization.create({
      data: {
        name: 'Test Agency',
        slug: 'test-agency',
        customDomain: 'studio.test-agency.com',
        plan: 'pro',
        maxProjects: 10,
        maxUsers: 10,
        brandingColors: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
        },
      },
    });
    orgId = org.id;
    console.log('✅ Organisation créée:', org.id, '-', org.name);

    // 2. Lister les organisations
    console.log('\n→ Lister les organisations...');
    const orgs = await db.organization.findMany({
      orderBy: { createdAt: 'desc' },
    });
    console.log(`✅ ${orgs.length} organisation(s) trouvée(s)`);
    orgs.forEach((o) => console.log(`   - ${o.name} (${o.slug})`));

    // 3. Mettre à jour l'organisation
    console.log('\n→ Mettre à jour l\'organisation...');
    const updatedOrg = await db.organization.update({
      where: { id: orgId },
      data: {
        plan: 'enterprise',
        maxProjects: 50,
      },
    });
    console.log('✅ Organisation mise à jour:', updatedOrg.plan, '-', updatedOrg.maxProjects, 'projets max');

    // ===================================================================
    // USERS
    // ===================================================================
    console.log('\n\n👥 TEST: Users\n');

    // 1. Créer un utilisateur
    console.log('→ Créer un utilisateur...');
    const user = await db.user.create({
      data: {
        email: 'admin@test-agency.com',
        name: 'Admin Test',
        role: 'AGENCY_ADMIN',
        organizationId: orgId,
      },
      include: {
        organization: true,
      },
    });
    userId = user.id;
    console.log('✅ Utilisateur créé:', user.email, '-', user.role);

    // 2. Lister les utilisateurs
    console.log('\n→ Lister les utilisateurs de l\'organisation...');
    const users = await db.user.findMany({
      where: { organizationId: orgId },
      include: { organization: true },
    });
    console.log(`✅ ${users.length} utilisateur(s) trouvé(s)`);
    users.forEach((u) => console.log(`   - ${u.name} (${u.email}) - ${u.role}`));

    // 3. Mettre à jour l'utilisateur
    console.log('\n→ Mettre à jour l\'utilisateur...');
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        name: 'Admin Test (Senior)',
        role: 'AGENCY_DEVELOPER',
      },
    });
    console.log('✅ Utilisateur mis à jour:', updatedUser.name, '-', updatedUser.role);

    // ===================================================================
    // PROJECTS
    // ===================================================================
    console.log('\n\n🚀 TEST: Projects\n');

    // 1. Créer un projet
    console.log('→ Créer un projet...');
    const project = await db.project.create({
      data: {
        name: 'Restaurant Le Gourmet',
        slug: 'restaurant-le-gourmet',
        organizationId: orgId,
        subdomain: 'le-gourmet.test-agency.com',
        templateId: TEMPLATE_ID,
        customDomain: 'www.legourmet.fr',
        status: 'CREATING',
        repoUrl: 'https://github.com/test-agency/le-gourmet',
      },
      include: {
        organization: true,
      },
    });
    projectId = project.id;
    console.log('✅ Projet créé:', project.name, '-', project.status);

    // 2. Lister les projets
    console.log('\n→ Lister les projets de l\'organisation...');
    const projects = await db.project.findMany({
      where: { organizationId: orgId },
      include: {
        organization: true,
        _count: {
          select: { deployments: true },
        },
      },
    });
    console.log(`✅ ${projects.length} projet(s) trouvé(s)`);
    projects.forEach((p) => console.log(`   - ${p.name} (${p.subdomain}) - ${p.status}`));

    // 3. Mettre à jour le projet
    console.log('\n→ Mettre à jour le projet...');
    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: {
        status: 'RUNNING',
        coolifyProjectId: 'coolify-abc123',
      },
    });
    console.log('✅ Projet mis à jour:', updatedProject.status, '-', updatedProject.coolifyProjectId);

    // 4. Créer un deployment
    console.log('\n→ Créer un déploiement...');
    const deployment = await db.deployment.create({
      data: {
        projectId: projectId,
        commitHash: 'abc123def456',
        commitMessage: 'Initial deployment',
        branch: 'main',
        buildNumber: 1,
        status: 'SUCCESS',
        startedAt: new Date(),
        finishedAt: new Date(),
        duration: 45,
      },
    });
    console.log('✅ Déploiement créé:', deployment.commitHash, '-', deployment.status);

    // 5. Récupérer le projet avec ses déploiements
    console.log('\n→ Récupérer le projet avec déploiements...');
    const projectWithDeps = await db.project.findUnique({
      where: { id: projectId },
      include: {
        organization: true,
        deployments: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { deployments: true },
        },
      },
    });
    console.log('✅ Projet récupéré:',
projectWithDeps!.name,
      '-',
      projectWithDeps!._count.deployments,
      'déploiement(s)'
    );

    // ===================================================================
    // CLEANUP
    // ===================================================================
    console.log('\n\n🧹 CLEANUP\n');

    console.log('→ Supprimer le projet (cascade deployments)...');
    await db.project.delete({ where: { id: projectId } });
    console.log('✅ Projet supprimé');

    console.log('\n→ Supprimer l\'utilisateur...');
    await db.user.delete({ where: { id: userId } });
    console.log('✅ Utilisateur supprimé');

    console.log('\n→ Supprimer l\'organisation...');
    await db.organization.delete({ where: { id: orgId } });
    console.log('✅ Organisation supprimée');

    // ===================================================================
    // RÉSUMÉ
    // ===================================================================
    console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║              ✅ Tous les tests réussis !                     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
