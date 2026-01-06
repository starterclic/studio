/**
 * Script de test Prisma - Da Vinci
 * V\u00e9rifie la connexion \u00e0 PostgreSQL et cr\u00e9e des donn\u00e9es de test
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n\ud83d\udd0d Test de connexion Prisma...\n')

  // Test 1: Connexion
  try {
    await prisma.$connect()
    console.log('\u2705 Connexion PostgreSQL : OK')
  } catch (error) {
    console.error('\u274c Erreur de connexion:', error)
    process.exit(1)
  }

  // Test 2: Cr\u00e9ation d'une organisation de test
  try {
    const org = await prisma.organization.create({
      data: {
        name: 'Agence Test',
        slug: 'agence-test',
        plan: 'free',
        maxProjects: 3,
        maxUsers: 5,
        maxStorageGB: 5,
      },
    })
    console.log('\u2705 Organisation cr\u00e9\u00e9e:', org.name, `(ID: ${org.id})`)

    // Test 3: Cr\u00e9ation d'un utilisateur de test
    const user = await prisma.user.create({
      data: {
        email: 'admin@agence-test.com',
        name: 'Admin Test',
        role: 'AGENCY_ADMIN',
        organizationId: org.id,
      },
    })
    console.log('\u2705 Utilisateur cr\u00e9\u00e9:', user.name, `(${user.email})`)

    // Test 4: Cr\u00e9ation d'un template de test
    const template = await prisma.template.create({
      data: {
        name: 'Master Astro Restaurant',
        slug: 'master-astro-restaurant',
        description: 'Template Astro moderne pour restaurants',
        sourceRepoUrl: 'https://github.com/davinci/master-astro-restaurant',
        category: 'restaurant',
        tags: ['astro', 'tailwind', 'modern'],
        hasKeystatic: true,
      },
    })
    console.log('\u2705 Template cr\u00e9\u00e9:', template.name)

    // Test 5: Cr\u00e9ation d'un projet de test
    const project = await prisma.project.create({
      data: {
        name: 'Restaurant Le Gourmet',
        slug: 'restaurant-le-gourmet',
        subdomain: 'restaurant-le-gourmet.agence-test.com',
        templateId: template.id,
        organizationId: org.id,
        status: 'CREATING',
      },
    })
    console.log('\u2705 Projet cr\u00e9\u00e9:', project.name)

    // Test 6: Lecture des donn\u00e9es avec relations
    const orgWithRelations = await prisma.organization.findUnique({
      where: { id: org.id },
      include: {
        users: true,
        projects: true,
      },
    })
    console.log(`\n\ud83d\udcca R\u00e9sum\u00e9:`)
    console.log(`- Organisation: ${orgWithRelations?.name}`)
    console.log(`- Utilisateurs: ${orgWithRelations?.users.length}`)
    console.log(`- Projets: ${orgWithRelations?.projects.length}`)

    console.log('\n\u2705 Tous les tests ont r\u00e9ussi!')
    console.log('\n\ud83e\uddea Nettoyage des donn\u00e9es de test...')

    // Nettoyage (cascade delete gr\u00e2ce au sch\u00e9ma)
    await prisma.organization.delete({ where: { id: org.id } })
    await prisma.template.delete({ where: { id: template.id } })

    console.log('\u2705 Nettoyage termin\u00e9')
  } catch (error) {
    console.error('\u274c Erreur lors des tests:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log('\n\ud83c\udf89 Script termin\u00e9 avec succ\u00e8s\n')
    process.exit(0)
  })
  .catch((e) => {
    console.error('\n\u274c Erreur fatale:', e)
    process.exit(1)
  })
