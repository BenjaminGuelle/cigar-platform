/**
 * Seed Brands & Cigars (Upsert)
 *
 * This script ADDS or UPDATES brands and cigars without deleting anything.
 * Safe to run on production - existing data is preserved.
 *
 * Run with: npx ts-node prisma/scripts/seed-brands-cigars.ts
 *
 * Add --dry-run to preview:
 *   npx ts-node prisma/scripts/seed-brands-cigars.ts --dry-run
 */

import { PrismaClient, CigarStatus } from '../../generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');

interface BrandSeed {
  id: string;
  name: string;
  country: string;
  isVerified: boolean;
  isSeed: boolean;
}

interface CigarSeed {
  slug: string;
  brandId: string;
  name: string;
  vitola?: string;
  length?: number;
  ringGauge?: number;
  wrapper?: string;
  origin?: string;
  strength?: number;
  description?: string;
  isVerified: boolean;
  isSeed: boolean;
}

async function loadJsonFile<T>(filename: string): Promise<T> {
  const filePath = path.join(__dirname, '../../docs/seed', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

async function getOrCreateSystemUser(): Promise<string> {
  const admin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
    orderBy: { createdAt: 'asc' },
  });

  if (admin) {
    console.log(`   Using existing admin: ${admin.email}`);
    return admin.id;
  }

  const systemUser = await prisma.user.create({
    data: {
      email: 'system@cigar-platform.app',
      displayName: 'System',
      username: 'system',
      role: 'SUPER_ADMIN',
      visibility: 'PRIVATE',
    },
  });

  await prisma.userPlan.create({
    data: {
      userId: systemUser.id,
      type: 'PREMIUM',
      source: 'LIFETIME',
      status: 'ACTIVE',
      expiresAt: null,
      giftReason: 'System Account',
    },
  });

  console.log(`   Created system user: ${systemUser.email}`);
  return systemUser.id;
}

async function main() {
  console.log('═'.repeat(60));
  console.log('   🌱 SEED BRANDS & CIGARS (UPSERT)');
  console.log('═'.repeat(60));

  if (isDryRun) {
    console.log('\n   ⚠️  DRY RUN MODE - No changes will be made\n');
  }

  // Load seed data
  const brands = await loadJsonFile<BrandSeed[]>('BRANDS.json');
  const cigars = await loadJsonFile<CigarSeed[]>('CIGAR.json');

  // Count current data
  const currentBrands = await prisma.brand.count();
  const currentCigars = await prisma.cigar.count();

  console.log('\n📊 Current state:');
  console.log(`   - Brands: ${currentBrands}`);
  console.log(`   - Cigars: ${currentCigars}`);
  console.log(`\n📦 Will upsert: ${brands.length} brands, ${cigars.length} cigars`);

  if (isDryRun) {
    console.log('\n   [DRY RUN] No changes made');
    console.log('═'.repeat(60));
    return;
  }

  // Get/create system user
  console.log('\n👤 Getting system user...');
  const userId = await getOrCreateSystemUser();

  // Upsert brands
  console.log('\n📦 Upserting brands...');
  const brandIdMap = new Map<string, string>();
  let brandsCreated = 0;
  let brandsUpdated = 0;

  for (const brandData of brands) {
    const brand = await prisma.brand.upsert({
      where: { slug: brandData.id },
      create: {
        name: brandData.name,
        slug: brandData.id,
        country: brandData.country,
        isVerified: brandData.isVerified,
        createdBy: userId,
      },
      update: {
        name: brandData.name,
        country: brandData.country,
        isVerified: brandData.isVerified,
      },
    });
    brandIdMap.set(brandData.id, brand.id);

    const existing = await prisma.brand.findUnique({ where: { slug: brandData.id } });
    if (existing?.createdAt.getTime() === brand.createdAt.getTime()) {
      brandsUpdated++;
    } else {
      brandsCreated++;
    }
  }
  console.log(`   ✓ ${brandsCreated} created, ${brandsUpdated} updated`);

  // Upsert cigars
  console.log('\n🚬 Upserting cigars...');
  let cigarsCreated = 0;
  let cigarsUpdated = 0;
  let skipped = 0;

  for (const cigarData of cigars) {
    const brandUuid = brandIdMap.get(cigarData.brandId);

    if (!brandUuid) {
      console.log(`   ⚠️  Skipped ${cigarData.name} - brand "${cigarData.brandId}" not found`);
      skipped++;
      continue;
    }

    // Check if exists by composite key (brandId + name)
    const existing = await prisma.cigar.findUnique({
      where: {
        brandId_name: {
          brandId: brandUuid,
          name: cigarData.name,
        },
      },
    });

    await prisma.cigar.upsert({
      where: {
        brandId_name: {
          brandId: brandUuid,
          name: cigarData.name,
        },
      },
      create: {
        brandId: brandUuid,
        name: cigarData.name,
        slug: cigarData.slug,
        vitola: cigarData.vitola,
        length: cigarData.length,
        ringGauge: cigarData.ringGauge,
        wrapper: cigarData.wrapper,
        origin: cigarData.origin,
        strength: cigarData.strength,
        description: cigarData.description,
        status: cigarData.isVerified ? CigarStatus.VERIFIED : CigarStatus.PENDING,
        isVerified: cigarData.isVerified,
        verifiedBy: cigarData.isVerified ? userId : null,
        verifiedAt: cigarData.isVerified ? new Date() : null,
        createdBy: userId,
      },
      update: {
        slug: cigarData.slug,
        vitola: cigarData.vitola,
        length: cigarData.length,
        ringGauge: cigarData.ringGauge,
        wrapper: cigarData.wrapper,
        origin: cigarData.origin,
        strength: cigarData.strength,
        description: cigarData.description,
        isVerified: cigarData.isVerified,
        status: cigarData.isVerified ? CigarStatus.VERIFIED : CigarStatus.PENDING,
      },
    });

    if (existing) {
      cigarsUpdated++;
    } else {
      cigarsCreated++;
    }
  }
  console.log(`   ✓ ${cigarsCreated} created, ${cigarsUpdated} updated, ${skipped} skipped`);

  // Summary
  const newBrandCount = await prisma.brand.count();
  const newCigarCount = await prisma.cigar.count();

  console.log('\n' + '═'.repeat(60));
  console.log('   ✅ SEED COMPLETE');
  console.log('═'.repeat(60));
  console.log(`   - Brands: ${currentBrands} → ${newBrandCount}`);
  console.log(`   - Cigars: ${currentCigars} → ${newCigarCount}`);
  console.log('═'.repeat(60));
}

main()
  .catch((e) => {
    console.error('\n❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });