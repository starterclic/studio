/**
 * Script pour créer un template de test dans la base de données
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Création du template de test...');

  const template = await prisma.template.create({
    data: {
      name: 'Master Astro Restaurant',
      slug: 'master-astro-restaurant',
      description: 'Template moderne pour restaurants avec Astro',
      thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      sourceRepoUrl: 'https://github.com/davinci/master-astro-restaurant',
      sourceBranch: 'main',
      category: 'restaurant',
      tags: ['astro', 'tailwind', 'modern', 'restaurant'],
      version: '1.0.0',
      isActive: true,
      isPremium: false,
      hasKeystatic: true,
      hasI18n: false,
      hasEcommerce: false,
    },
  });

  console.log('✅ Template créé:', template);
  console.log('ID:', template.id);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
