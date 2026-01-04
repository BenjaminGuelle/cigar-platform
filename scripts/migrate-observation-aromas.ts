/**
 * Migration Script: Extract aromas from organoleptic to top-level aromas field
 *
 * This script fixes existing observations that have aromas stored inside
 * organoleptic but not at the top level.
 *
 * Run with: npx ts-node scripts/migrate-observation-aromas.ts
 */

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

interface FlavorTag {
  id: string;
  intensity: number;
}

/**
 * Extract aromas from organoleptic JSON structure
 * Handles nested structures like { coldDraw: { aromas: [{id: 'boise'}] } }
 */
function extractAromasFromOrganoleptic(
  organoleptic: Record<string, unknown> | null | undefined
): string[] {
  if (!organoleptic) return [];

  const aromas: string[] = [];

  const extractFromObject = (obj: unknown): void => {
    if (!obj || typeof obj !== 'object') return;

    const record = obj as Record<string, unknown>;

    // Check if this object has an aromas array
    if (Array.isArray(record['aromas'])) {
      for (const aroma of record['aromas']) {
        // FlavorTag format: { id: string, intensity: number }
        if (aroma && typeof aroma === 'object' && 'id' in aroma) {
          const aromaId = (aroma as FlavorTag).id;
          if (aromaId && !aromas.includes(aromaId)) {
            aromas.push(aromaId);
          }
        }
      }
    }

    // Recursively check nested objects (but not arrays)
    for (const value of Object.values(record)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        extractFromObject(value);
      }
    }
  };

  extractFromObject(organoleptic);
  return aromas;
}

async function migrateObservationAromas(): Promise<void> {
  console.log('🚀 Starting observation aromas migration...\n');

  // Get all observations
  const observations = await prisma.observation.findMany({
    select: {
      id: true,
      phase: true,
      aromas: true,
      organoleptic: true,
    },
  });

  console.log(`Found ${observations.length} observations with organoleptic data\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const observation of observations) {
    try {
      // Extract aromas from organoleptic
      const extractedAromas = extractAromasFromOrganoleptic(
        observation.organoleptic as Record<string, unknown>
      );

      // Skip if no aromas found in organoleptic
      if (extractedAromas.length === 0) {
        skippedCount++;
        continue;
      }

      // Skip if aromas already populated
      if (observation.aromas.length > 0) {
        console.log(`⏭️  Observation ${observation.id} (${observation.phase}): already has aromas, skipping`);
        skippedCount++;
        continue;
      }

      // Update the observation with extracted aromas
      await prisma.observation.update({
        where: { id: observation.id },
        data: { aromas: extractedAromas },
      });

      console.log(`✅ Observation ${observation.id} (${observation.phase}): added ${extractedAromas.length} aromas - [${extractedAromas.join(', ')}]`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Error updating observation ${observation.id}:`, error);
      errorCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Total observations: ${observations.length}`);
  console.log(`   Updated: ${updatedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log('\n✨ Migration complete!');
}

// Run the migration
migrateObservationAromas()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
