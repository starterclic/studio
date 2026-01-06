/**
 * Seed Component Templates
 *
 * Populates the database with all component templates from the registry
 */

import { PrismaClient } from '@prisma/client';
import { COMPONENT_REGISTRY } from '../app/lib/components/registry';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding component templates...\n');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const component of COMPONENT_REGISTRY) {
    try {
      // Check if component already exists
      const existing = await prisma.componentTemplate.findFirst({
        where: {
          slug: component.slug,
          organizationId: null, // Global components have null organizationId
        },
      });

      if (existing) {
        // Update existing component
        await prisma.componentTemplate.update({
          where: { id: existing.id },
          data: {
            name: component.name,
            description: component.description,
            category: component.category,
            astroCode: component.astroCode,
            propsSchema: component.propsSchema,
            thumbnail: component.thumbnail,
            previewUrl: component.previewUrl,
            isGlobal: component.isGlobal,
            isPremium: component.isPremium,
            version: component.version,
          },
        });

        console.log(`  ✓ Updated: ${component.name} (${component.slug})`);
        updated++;
      } else {
        // Create new component
        await prisma.componentTemplate.create({
          data: {
            slug: component.slug,
            name: component.name,
            description: component.description,
            category: component.category,
            astroCode: component.astroCode,
            propsSchema: component.propsSchema,
            thumbnail: component.thumbnail,
            previewUrl: component.previewUrl,
            isGlobal: component.isGlobal,
            isPremium: component.isPremium,
            organizationId: null, // Global components
            version: component.version,
          },
        });

        console.log(`  ✓ Created: ${component.name} (${component.slug})`);
        created++;
      }
    } catch (error) {
      console.error(`  ✗ Failed to seed ${component.slug}:`, error);
      skipped++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total:   ${COMPONENT_REGISTRY.length}\n`);

  console.log('✅ Component templates seeded successfully!\n');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
