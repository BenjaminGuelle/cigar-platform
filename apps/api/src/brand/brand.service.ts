import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { BrandResponseDto, BrandFilterDto } from './dto';
import { slugifyBrand } from '../common/utils/slugify';

@Injectable()
export class BrandService {
  private readonly logger = new Logger(BrandService.name);

  constructor(private readonly prisma: PrismaService) {}

  private readonly MAX_BRANDS = 100;

  /**
   * Find all brands with optional search filter
   * Limited to MAX_BRANDS for security
   */
  async findAll(filter: BrandFilterDto): Promise<BrandResponseDto[]> {
    const { search } = filter;

    const brands = await this.prisma.brand.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        slug: true,
        country: true,
        description: true,
        logoUrl: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: [
        { isVerified: 'desc' }, // Verified brands first
        { name: 'asc' },
      ],
      take: this.MAX_BRANDS,
    });

    return brands;
  }

  /**
   * Find brand by exact name (case-insensitive)
   * Used for checking existence before creation
   */
  async findByName(name: string): Promise<BrandResponseDto | null> {
    const brand = await this.prisma.brand.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: {
        id: true,
        name: true,
        slug: true,
        country: true,
        description: true,
        logoUrl: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return brand;
  }

  /**
   * Create a new brand (unverified by default)
   * Called during cigar creation if brand doesn't exist
   */
  async create(
    name: string,
    country: string | undefined,
    userId: string,
  ): Promise<BrandResponseDto> {
    const slug = slugifyBrand(name);

    const brand = await this.prisma.brand.create({
      data: {
        name: name.trim(),
        slug,
        country: country?.trim() || null,
        isVerified: false,
        createdBy: userId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        country: true,
        description: true,
        logoUrl: true,
        isVerified: true,
        createdAt: true,
      },
    });

    this.logger.log(`Created brand: ${brand.name} (${brand.id})`);
    return brand;
  }
}
