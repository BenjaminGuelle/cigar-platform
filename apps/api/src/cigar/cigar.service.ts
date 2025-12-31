import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { BrandService } from '../brand/brand.service';
import { CreateCigarDto, CigarResponseDto } from './dto';
import { slugifyCigar } from '../common/utils/slugify';
import { CigarStatus } from '@cigar-platform/prisma-client';

@Injectable()
export class CigarService {
  private readonly logger = new Logger(CigarService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brandService: BrandService,
  ) {}

  /**
   * Find cigar by slug (public endpoint)
   */
  async findBySlug(slug: string): Promise<CigarResponseDto> {
    const cigar = await this.prisma.cigar.findUnique({
      where: { slug },
      include: {
        brand: {
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
        },
      },
    });

    if (!cigar) {
      throw new NotFoundException(`Cigar with slug "${slug}" not found`);
    }

    return {
      id: cigar.id,
      name: cigar.name,
      slug: cigar.slug,
      vitola: cigar.vitola ?? '',
      strength: cigar.strength ?? 3,
      brand: cigar.brand,
      isVerified: cigar.isVerified,
      status: cigar.status,
      createdAt: cigar.createdAt,
    };
  }

  /**
   * Create a new cigar with inline brand creation
   */
  async create(
    dto: CreateCigarDto,
    userId: string,
  ): Promise<CigarResponseDto> {
    // 1. Find or create brand
    let brand = await this.brandService.findByName(dto.brandName);

    if (!brand) {
      brand = await this.brandService.create(
        dto.brandName,
        dto.brandCountry,
        userId,
      );
      this.logger.log(`Auto-created brand: ${brand.name}`);
    }

    // 2. Check if cigar already exists
    const existingCigar = await this.prisma.cigar.findUnique({
      where: {
        brandId_name: {
          brandId: brand.id,
          name: dto.name,
        },
      },
    });

    if (existingCigar) {
      throw new ConflictException(
        `Cigar "${dto.name}" already exists for brand "${brand.name}"`,
      );
    }

    // 3. Create cigar
    const slug = slugifyCigar(brand.slug, dto.name);

    const cigar = await this.prisma.cigar.create({
      data: {
        name: dto.name,
        slug,
        brandId: brand.id,
        vitola: dto.vitola,
        strength: dto.strength,
        status: CigarStatus.PENDING,
        isVerified: false,
        createdBy: userId,
      },
      include: {
        brand: {
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
        },
      },
    });

    this.logger.log(`Created cigar: ${cigar.name} (${cigar.id})`);

    return {
      id: cigar.id,
      name: cigar.name,
      slug: cigar.slug,
      vitola: cigar.vitola ?? '',
      strength: cigar.strength ?? 3,
      brand: cigar.brand,
      isVerified: cigar.isVerified,
      status: cigar.status,
      createdAt: cigar.createdAt,
    };
  }
}
