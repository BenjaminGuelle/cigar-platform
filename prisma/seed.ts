import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Get the first user as the creator (or create a system user)
  let systemUser = await prisma.user.findFirst({
    where: {
      role: 'SUPER_ADMIN',
    },
  });

  // If no super admin, use the first user
  if (!systemUser) {
    systemUser = await prisma.user.findFirst();
  }

  // If no user exists, create a test admin user
  if (!systemUser) {
    console.log('📝 No users found. Creating test admin user...');
    systemUser = await prisma.user.create({
      data: {
        email: 'admin@cigar-platform.local',
        displayName: 'Admin Test',
        username: 'admin',
        role: 'SUPER_ADMIN',
        visibility: 'PUBLIC',
        shareEvaluationsPublicly: true,
      },
    });
    console.log(`✅ Created test admin user: ${systemUser.displayName} (${systemUser.email})`);
  } else {
    console.log(`✅ Using existing user: ${systemUser.displayName} (${systemUser.id})`);
  }

  // Premium Cigar Brands
  const brands = [
    // === CUBA ===
    {
      name: 'Cohiba',
      slug: 'cohiba',
      country: 'Cuba',
      description: 'Marque emblématique cubaine, créée en 1966 pour Fidel Castro. Symbole du luxe et de la qualité.',
    },
    {
      name: 'Montecristo',
      slug: 'montecristo',
      country: 'Cuba',
      description: 'La marque cubaine la plus vendue au monde. Référence absolue depuis 1935.',
    },
    {
      name: 'Romeo y Julieta',
      slug: 'romeo-y-julieta',
      country: 'Cuba',
      description: 'Fondée en 1875, cette marque historique offre une gamme très variée de modules.',
    },
    {
      name: 'Partagás',
      slug: 'partagas',
      country: 'Cuba',
      description: 'Fondée en 1845, reconnue pour ses cigares corsés et aromatiques.',
    },
    {
      name: 'H. Upmann',
      slug: 'h-upmann',
      country: 'Cuba',
      description: 'Marque fondée en 1844, appréciée pour son élégance et sa finesse.',
    },
    {
      name: 'Hoyo de Monterrey',
      slug: 'hoyo-de-monterrey',
      country: 'Cuba',
      description: 'Créée en 1865, connue pour ses cigares doux et aromatiques.',
    },
    {
      name: 'Bolívar',
      slug: 'bolivar',
      country: 'Cuba',
      description: 'Marque puissante et corsée, fondée en 1902.',
    },
    {
      name: 'Trinidad',
      slug: 'trinidad',
      country: 'Cuba',
      description: 'Marque exclusive créée en 1969, accessible au public depuis 1998.',
    },

    // === RÉPUBLIQUE DOMINICAINE ===
    {
      name: 'Arturo Fuente',
      slug: 'arturo-fuente',
      country: 'République Dominicaine',
      description: 'Manufacture familiale fondée en 1912. Célèbre pour la ligne Opus X.',
    },
    {
      name: 'Davidoff',
      slug: 'davidoff',
      country: 'République Dominicaine',
      description: 'Marque suisse de prestige, symbole de luxe et de raffinement depuis 1968.',
    },
    {
      name: 'La Flor Dominicana',
      slug: 'la-flor-dominicana',
      country: 'République Dominicaine',
      description: 'Manufacture dominicaine reconnue pour ses cigares puissants et complexes.',
    },
    {
      name: 'Avo',
      slug: 'avo',
      country: 'République Dominicaine',
      description: 'Créée par le pianiste Avo Uvezian, connue pour son élégance.',
    },

    // === NICARAGUA ===
    {
      name: 'Padrón',
      slug: 'padron',
      country: 'Nicaragua',
      description: 'Manufacture familiale fondée en 1964. Référence en matière de qualité et de consistance.',
    },
    {
      name: 'Oliva',
      slug: 'oliva',
      country: 'Nicaragua',
      description: 'Manufacture familiale cultivant son propre tabac. Excellent rapport qualité-prix.',
    },
    {
      name: 'My Father',
      slug: 'my-father',
      country: 'Nicaragua',
      description: 'Fondée par José "Pepín" García, reconnue pour ses blends puissants.',
    },
    {
      name: 'Drew Estate',
      slug: 'drew-estate',
      country: 'Nicaragua',
      description: 'Marque innovante, célèbre pour sa ligne Acid et Liga Privada.',
    },
    {
      name: 'Joya de Nicaragua',
      slug: 'joya-de-nicaragua',
      country: 'Nicaragua',
      description: 'Première manufacture premium du Nicaragua, fondée en 1968.',
    },

    // === HONDURAS ===
    {
      name: 'Alec Bradley',
      slug: 'alec-bradley',
      country: 'Honduras',
      description: 'Marque américaine fondée en 1996, reconnue pour ses blends innovants.',
    },
    {
      name: 'Camacho',
      slug: 'camacho',
      country: 'Honduras',
      description: 'Marque fondée en 1961, reconnue pour ses cigares puissants.',
    },
  ];

  console.log(`\n📦 Seeding ${brands.length} premium brands...`);

  for (const brandData of brands) {
    const brand = await prisma.brand.upsert({
      where: { slug: brandData.slug },
      update: {
        name: brandData.name,
        country: brandData.country,
        description: brandData.description,
      },
      create: {
        name: brandData.name,
        slug: brandData.slug,
        country: brandData.country,
        description: brandData.description,
        logoUrl: null, // Logos will be added later
        createdBy: systemUser.id,
      },
    });
    console.log(`  ✓ ${brand.name} (${brand.country})`);
  }

  console.log(`\n✅ ${brands.length} brands created`);

  // === SEED CIGARS ===
  console.log(`\n📦 Seeding test cigars...`);

  // Helper to get brand by slug
  const getBrand = async (slug: string) => {
    const brand = await prisma.brand.findUnique({ where: { slug } });
    if (!brand) throw new Error(`Brand ${slug} not found`);
    return brand;
  };

  // Cigars data
  const cigars = [
    // === COHIBA ===
    {
      brand: 'cohiba',
      name: 'Siglo VI',
      vitola: 'Canonazo',
      length: 150,
      ringGauge: 52,
      wrapper: 'Colorado',
      origin: 'Cuba',
      strength: 4,
      status: 'VERIFIED' as const,
    },
    {
      brand: 'cohiba',
      name: 'Behike 52',
      vitola: 'Robusto',
      length: 125,
      ringGauge: 52,
      wrapper: 'Colorado Oscuro',
      origin: 'Cuba',
      strength: 5,
      status: 'VERIFIED' as const,
    },
    {
      brand: 'cohiba',
      name: 'Robustos',
      vitola: 'Robusto',
      length: 124,
      ringGauge: 50,
      wrapper: 'Colorado',
      origin: 'Cuba',
      strength: 4,
      status: 'VERIFIED' as const,
    },

    // === MONTECRISTO ===
    {
      brand: 'montecristo',
      name: 'No. 2',
      vitola: 'Torpedo',
      length: 156,
      ringGauge: 52,
      wrapper: 'Colorado',
      origin: 'Cuba',
      strength: 4,
      status: 'VERIFIED' as const,
    },
    {
      brand: 'montecristo',
      name: 'No. 4',
      vitola: 'Petit Corona',
      length: 129,
      ringGauge: 42,
      wrapper: 'Colorado',
      origin: 'Cuba',
      strength: 3,
      status: 'VERIFIED' as const,
    },
    {
      brand: 'montecristo',
      name: 'Edmundo',
      vitola: 'Robusto Extra',
      length: 135,
      ringGauge: 52,
      wrapper: 'Colorado',
      origin: 'Cuba',
      strength: 4,
      status: 'VERIFIED' as const,
    },

    // === ROMEO Y JULIETA ===
    {
      brand: 'romeo-y-julieta',
      name: 'Churchill',
      vitola: 'Julieta No. 2',
      length: 178,
      ringGauge: 47,
      wrapper: 'Colorado',
      origin: 'Cuba',
      strength: 3,
      status: 'VERIFIED' as const,
    },
    {
      brand: 'romeo-y-julieta',
      name: 'Wide Churchills',
      vitola: 'Julieta',
      length: 130,
      ringGauge: 55,
      wrapper: 'Colorado',
      origin: 'Cuba',
      strength: 4,
      status: 'VERIFIED' as const,
    },

    // === PARTAGÁS ===
    {
      brand: 'partagas',
      name: 'Serie D No. 4',
      vitola: 'Robusto',
      length: 124,
      ringGauge: 50,
      wrapper: 'Colorado Oscuro',
      origin: 'Cuba',
      strength: 5,
      status: 'VERIFIED' as const,
    },
    {
      brand: 'partagas',
      name: 'Serie P No. 2',
      vitola: 'Torpedo',
      length: 156,
      ringGauge: 52,
      wrapper: 'Colorado Oscuro',
      origin: 'Cuba',
      strength: 5,
      status: 'VERIFIED' as const,
    },

    // === PADRÓN ===
    {
      brand: 'padron',
      name: '1964 Anniversary Maduro',
      vitola: 'Torpedo',
      length: 152,
      ringGauge: 52,
      wrapper: 'Maduro',
      origin: 'Nicaragua',
      strength: 5,
      status: 'VERIFIED' as const,
    },
    {
      brand: 'padron',
      name: '1926 Serie No. 9',
      vitola: 'Robusto',
      length: 140,
      ringGauge: 56,
      wrapper: 'Natural',
      origin: 'Nicaragua',
      strength: 5,
      status: 'VERIFIED' as const,
    },

    // === ARTURO FUENTE ===
    {
      brand: 'arturo-fuente',
      name: 'Opus X Robusto',
      vitola: 'Robusto',
      length: 133,
      ringGauge: 50,
      wrapper: 'Rosado Oscuro',
      origin: 'République Dominicaine',
      strength: 4,
      status: 'VERIFIED' as const,
    },
    {
      brand: 'arturo-fuente',
      name: 'Hemingway Short Story',
      vitola: 'Perfecto',
      length: 102,
      ringGauge: 49,
      wrapper: 'Cameroon',
      origin: 'République Dominicaine',
      strength: 3,
      status: 'VERIFIED' as const,
    },

    // === DAVIDOFF ===
    {
      brand: 'davidoff',
      name: 'Grand Cru No. 2',
      vitola: 'Torpedo',
      length: 156,
      ringGauge: 52,
      wrapper: 'Connecticut',
      origin: 'République Dominicaine',
      strength: 2,
      status: 'VERIFIED' as const,
    },
    {
      brand: 'davidoff',
      name: 'Nicaragua Robusto',
      vitola: 'Robusto',
      length: 127,
      ringGauge: 50,
      wrapper: 'Habano Oscuro',
      origin: 'Nicaragua',
      strength: 4,
      status: 'VERIFIED' as const,
    },

    // === OLIVA ===
    {
      brand: 'oliva',
      name: 'Serie V Melanio Robusto',
      vitola: 'Robusto',
      length: 127,
      ringGauge: 50,
      wrapper: 'Sumatra',
      origin: 'Nicaragua',
      strength: 4,
      status: 'VERIFIED' as const,
    },
    {
      brand: 'oliva',
      name: 'Serie O Robusto',
      vitola: 'Robusto',
      length: 127,
      ringGauge: 50,
      wrapper: 'Maduro',
      origin: 'Nicaragua',
      strength: 3,
      status: 'VERIFIED' as const,
    },

    // === MY FATHER ===
    {
      brand: 'my-father',
      name: 'Le Bijou 1922 Torpedo',
      vitola: 'Torpedo',
      length: 152,
      ringGauge: 52,
      wrapper: 'Habano Oscuro',
      origin: 'Nicaragua',
      strength: 5,
      status: 'VERIFIED' as const,
    },

    // === TEST CIGARS (PENDING - to test verification workflow) ===
    {
      brand: 'cohiba',
      name: 'Siglo VII',
      vitola: 'Double Robusto',
      length: 160,
      ringGauge: 54,
      wrapper: 'Colorado',
      origin: 'Cuba',
      strength: 4,
      status: 'PENDING' as const,
    },
    {
      brand: 'montecristo',
      name: 'Petit No. 3',
      vitola: 'Corona',
      length: 142,
      ringGauge: 44,
      wrapper: 'Colorado',
      origin: 'Cuba',
      strength: 3,
      status: 'PENDING' as const,
    },
  ];

  for (const cigarData of cigars) {
    const brand = await getBrand(cigarData.brand);
    const slug = `${brand.slug}-${cigarData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    const cigar = await prisma.cigar.upsert({
      where: { slug },
      update: {
        name: cigarData.name,
        vitola: cigarData.vitola,
        length: cigarData.length,
        ringGauge: cigarData.ringGauge,
        wrapper: cigarData.wrapper,
        origin: cigarData.origin,
        strength: cigarData.strength,
        status: cigarData.status,
        isVerified: cigarData.status === 'VERIFIED',
        verifiedBy: cigarData.status === 'VERIFIED' ? systemUser.id : null,
        verifiedAt: cigarData.status === 'VERIFIED' ? new Date() : null,
      },
      create: {
        brandId: brand.id,
        name: cigarData.name,
        slug,
        vitola: cigarData.vitola,
        length: cigarData.length,
        ringGauge: cigarData.ringGauge,
        wrapper: cigarData.wrapper,
        origin: cigarData.origin,
        strength: cigarData.strength,
        status: cigarData.status,
        isVerified: cigarData.status === 'VERIFIED',
        verifiedBy: cigarData.status === 'VERIFIED' ? systemUser.id : null,
        verifiedAt: cigarData.status === 'VERIFIED' ? new Date() : null,
        createdBy: systemUser.id,
      },
    });

    const statusEmoji = cigarData.status === 'VERIFIED' ? '✅' : '⏳';
    console.log(`  ${statusEmoji} ${brand.name} ${cigar.name} (${cigar.vitola}, ${cigar.length}mm × ${cigar.ringGauge})`);
  }

  console.log('\n✨ Seed completed successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`  - ${brands.length} brands created`);
  console.log(`  - ${cigars.length} cigars created`);
  console.log(`  - ${cigars.filter(c => c.status === 'VERIFIED').length} verified cigars`);
  console.log(`  - ${cigars.filter(c => c.status === 'PENDING').length} pending cigars (test verification workflow)`);
  console.log(`\n💡 Next steps:`);
  console.log(`  1. View in Prisma Studio: npm run prisma:studio`);
  console.log(`  2. Implement Omnisearch (search brands/cigars/clubs/users)`);
  console.log(`  3. Implement Tasting CRUD with Observation system`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
