# NestJS Patterns - All Stars

This document defines **senior-level NestJS patterns** for the Cigar Platform API. These patterns ensure clean architecture, maintainability, and type safety.

---

## 1️⃣ Module Architecture

### Folder Structure

```
apps/api/src/
├── club/
│   ├── club.controller.ts       # HTTP routes
│   ├── club.service.ts          # Business logic
│   ├── club.module.ts           # Module definition
│   ├── dto/
│   │   ├── create-club.dto.ts
│   │   ├── update-club.dto.ts
│   │   └── club-response.dto.ts
│   └── entities/                # Optional: domain entities
│       └── club.entity.ts
├── common/
│   ├── exceptions/              # Custom exceptions
│   ├── filters/                 # Exception filters
│   ├── interceptors/            # Response interceptors
│   ├── guards/                  # Auth guards
│   └── decorators/              # Custom decorators
└── app/
    ├── app.module.ts
    ├── app.controller.ts
    └── prisma.service.ts
```

### Module Definition

```typescript
// ✅ CORRECT - Clean module with clear dependencies
import { Module } from '@nestjs/common';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { PrismaService } from '../app/prisma.service';

@Module({
  controllers: [ClubController],
  providers: [ClubService, PrismaService],
  exports: [ClubService], // Export if used by other modules
})
export class ClubModule {}

// ❌ INCORRECT - Circular dependencies, unclear exports
@Module({
  imports: [EventModule], // ❌ Can create circular dependency
  controllers: [ClubController],
  providers: [ClubService, EventService], // ❌ Should be in EventModule
  exports: [], // ❌ Not exporting service used elsewhere
})
```

**Rules**:
- **ONE controller per module** (except for nested routes)
- **ONE main service per module** (can have helper services)
- **ALWAYS inject PrismaService** (don't create new instances)
- **AVOID circular dependencies** (use forwardRef sparingly)
- **EXPORT services** used by other modules

---

## 2️⃣ Controllers (API Layer)

### Basic Structure

```typescript
// ✅ CORRECT - Complete controller with all decorators
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClubService } from './club.service';
import { CreateClubDto, UpdateClubDto, ClubResponseDto } from './dto';

@Controller('clubs')
@ApiTags('clubs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new club' })
  @ApiResponse({ status: 201, description: 'Club created', type: ClubResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() dto: CreateClubDto): Promise<ClubResponseDto> {
    return this.clubService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clubs' })
  @ApiResponse({ status: 200, description: 'Clubs found', type: [ClubResponseDto] })
  async findAll(@Query() query: FilterClubDto): Promise<ClubResponseDto[]> {
    return this.clubService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get club by ID' })
  @ApiResponse({ status: 200, description: 'Club found', type: ClubResponseDto })
  @ApiResponse({ status: 404, description: 'Club not found' })
  async findOne(@Param('id') id: string): Promise<ClubResponseDto> {
    return this.clubService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update club' })
  @ApiResponse({ status: 200, description: 'Club updated', type: ClubResponseDto })
  @ApiResponse({ status: 404, description: 'Club not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClubDto
  ): Promise<ClubResponseDto> {
    return this.clubService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete club' })
  @ApiResponse({ status: 204, description: 'Club deleted' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.clubService.remove(id);
  }
}
```

### HTTP Methods & Status Codes

| Method | Usage | Success Status | Common Errors |
|--------|-------|----------------|---------------|
| **GET** | Retrieve resource(s) | 200 OK | 404 Not Found |
| **POST** | Create resource | 201 Created | 400 Bad Request, 409 Conflict |
| **PUT** | Replace resource | 200 OK | 404 Not Found, 400 Bad Request |
| **PATCH** | Partial update | 200 OK | 404 Not Found, 400 Bad Request |
| **DELETE** | Remove resource | 204 No Content | 404 Not Found |

**Rules**:
- **ALWAYS use @HttpCode()** for non-default status codes (DELETE → 204)
- **NEVER handle business logic** in controllers (delegate to services)
- **ALWAYS add Swagger decorators** (@ApiOperation, @ApiResponse)
- **USE DTOs** for request validation (@Body, @Query)
- **RETURN DTOs** (not Prisma entities directly)

---

## 3️⃣ Services (Business Logic)

### Basic Structure

```typescript
// ✅ CORRECT - Clean service with proper error handling
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import {
  ClubNotFoundException,
  ClubAlreadyExistsException,
} from '../common/exceptions';
import { CreateClubDto, UpdateClubDto, ClubResponseDto } from './dto';

@Injectable()
export class ClubService {
  private readonly logger = new Logger(ClubService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClubDto): Promise<ClubResponseDto> {
    try {
      const club = await this.prisma.club.create({
        data: {
          name: dto.name,
          description: dto.description,
          ownerId: dto.ownerId,
        },
      });

      this.logger.log(`Club created: ${club.id}`);
      return this.mapToResponse(club);
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2002') {
        throw new ClubAlreadyExistsException(dto.name);
      }
      throw error;
    }
  }

  async findAll(): Promise<ClubResponseDto[]> {
    const clubs = await this.prisma.club.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return clubs.map(club => this.mapToResponse(club));
  }

  async findOne(id: string): Promise<ClubResponseDto> {
    const club = await this.prisma.club.findUnique({
      where: { id },
      include: {
        owner: true,
        members: true,
      },
    });

    if (!club) {
      throw new ClubNotFoundException(id);
    }

    return this.mapToResponse(club);
  }

  async update(id: string, dto: UpdateClubDto): Promise<ClubResponseDto> {
    // Verify club exists
    await this.findOne(id);

    const updated = await this.prisma.club.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Club updated: ${id}`);
    return this.mapToResponse(updated);
  }

  async remove(id: string): Promise<void> {
    // Verify club exists
    await this.findOne(id);

    await this.prisma.club.delete({
      where: { id },
    });

    this.logger.log(`Club deleted: ${id}`);
  }

  // Private mapper to DTO
  private mapToResponse(club: any): ClubResponseDto {
    return {
      id: club.id,
      name: club.name,
      description: club.description,
      createdAt: club.createdAt,
    };
  }
}
```

**Rules**:
- **ALWAYS use Logger** for important operations (create, update, delete)
- **NEVER expose Prisma entities** directly (use mapper to DTO)
- **THROW typed exceptions** (not generic Error)
- **VALIDATE business rules** in service (not in controller)
- **USE transactions** when updating multiple tables
- **KEEP services focused** (Single Responsibility Principle)

### Transactions

```typescript
// ✅ CORRECT - Use transaction for multiple operations
async createEventWithCigars(dto: CreateEventDto): Promise<EventResponseDto> {
  const event = await this.prisma.$transaction(async (tx) => {
    // Create event
    const newEvent = await tx.event.create({
      data: {
        name: dto.name,
        date: dto.date,
        clubId: dto.clubId,
      },
    });

    // Create cigars
    await tx.cigar.createMany({
      data: dto.cigars.map(cigar => ({
        ...cigar,
        eventId: newEvent.id,
      })),
    });

    return newEvent;
  });

  return this.mapToResponse(event);
}

// ❌ INCORRECT - No transaction, can fail partially
async createEventWithCigars(dto: CreateEventDto): Promise<EventResponseDto> {
  const event = await this.prisma.event.create({ data: dto });

  // ❌ If this fails, event is already created!
  await this.prisma.cigar.createMany({ data: dto.cigars });

  return this.mapToResponse(event);
}
```

---

## 4️⃣ DTOs (Data Transfer Objects)

### Create DTO

```typescript
// ✅ CORRECT - Complete validation
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClubDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @ApiProperty({
    description: 'Club name',
    example: 'Cigar Lovers Paris',
    minLength: 3,
    maxLength: 50,
  })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @ApiPropertyOptional({
    description: 'Club description',
    example: 'A club for cigar enthusiasts in Paris',
    maxLength: 500,
  })
  description?: string;
}
```

### Update DTO

```typescript
// ✅ CORRECT - Use PartialType (modern approach)
import { PartialType } from '@nestjs/mapped-types';
import { CreateClubDto } from './create-club.dto';

export class UpdateClubDto extends PartialType(CreateClubDto) {}

// Alternative: Manual (if you need to omit fields)
import { OmitType, PartialType } from '@nestjs/mapped-types';

export class UpdateClubDto extends PartialType(
  OmitType(CreateClubDto, ['ownerId']) // Can't change owner
) {}
```

### Response DTO

```typescript
// ✅ CORRECT - Use @Expose for serialization
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ClubResponseDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'Cigar Lovers Paris' })
  name: string;

  @Expose()
  @ApiProperty({ example: 'A club for cigar enthusiasts' })
  description: string;

  @Expose()
  @ApiProperty({ example: '2024-12-20T10:00:00.000Z' })
  createdAt: Date;

  // ❌ Password, internal fields are NOT exposed
  // passwordHash is excluded automatically (no @Expose)
}
```

### Query/Filter DTO

```typescript
// ✅ CORRECT - Pagination and filters
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterClubDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Items per page', default: 10, minimum: 1, maximum: 100 })
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search in name', example: 'Paris' })
  search?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Sort by field', example: 'name', enum: ['name', 'createdAt'] })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  order?: 'asc' | 'desc' = 'desc';
}
```

**Rules**:
- **ALWAYS use class-validator decorators** (@IsString, @IsNotEmpty, etc.)
- **ALWAYS use ApiProperty decorators** for Swagger
- **USE PartialType** for UpdateDto (DRY principle)
- **USE @Expose** in ResponseDto (explicit serialization)
- **NEVER expose** sensitive fields (password, tokens)
- **USE @Type()** for query params (they're strings by default)

---

## 5️⃣ Prisma Integration

### Query Optimization

```typescript
// ✅ CORRECT - Select only needed fields
async findOne(id: string): Promise<ClubResponseDto> {
  const club = await this.prisma.club.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      // Don't select heavy fields unless needed
    },
  });

  if (!club) {
    throw new ClubNotFoundException(id);
  }

  return club;
}

// ❌ INCORRECT - Fetches ALL fields (including heavy ones)
async findOne(id: string): Promise<ClubResponseDto> {
  const club = await this.prisma.club.findUnique({ where: { id } });
  // ❌ Loads unnecessary data
}
```

### Relations

```typescript
// ✅ CORRECT - Use include for relations
async findOneWithMembers(id: string): Promise<ClubWithMembersDto> {
  const club = await this.prisma.club.findUnique({
    where: { id },
    include: {
      members: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      owner: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
  });

  if (!club) {
    throw new ClubNotFoundException(id);
  }

  return club;
}

// Alternative: Use nested select for more control
async findOneWithMembers(id: string): Promise<ClubWithMembersDto> {
  const club = await this.prisma.club.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      members: {
        select: {
          id: true,
          displayName: true,
        },
        take: 10, // Limit members
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}
```

### Pagination

```typescript
// ✅ CORRECT - Offset pagination
async findAll(filter: FilterClubDto): Promise<PaginatedResponse<ClubResponseDto>> {
  const { page = 1, limit = 10, search, sortBy = 'createdAt', order = 'desc' } = filter;

  const skip = (page - 1) * limit;

  const where = search
    ? {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }
    : {};

  const [clubs, total] = await Promise.all([
    this.prisma.club.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
    }),
    this.prisma.club.count({ where }),
  ]);

  return {
    data: clubs.map(club => this.mapToResponse(club)),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

### Error Handling

```typescript
// ✅ CORRECT - Handle Prisma errors with type guard
import { Prisma } from '@prisma/client';

function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

async create(dto: CreateClubDto): Promise<ClubResponseDto> {
  try {
    const club = await this.prisma.club.create({ data: dto });
    return this.mapToResponse(club);
  } catch (error) {
    if (isPrismaError(error)) {
      // P2002: Unique constraint violation
      if (error.code === 'P2002') {
        throw new ClubAlreadyExistsException(dto.name);
      }
      // P2025: Record not found
      if (error.code === 'P2025') {
        throw new ClubNotFoundException('unknown');
      }
    }
    // Re-throw unknown errors
    throw error;
  }
}
```

**Common Prisma Error Codes**:
- `P2002`: Unique constraint violation
- `P2025`: Record not found
- `P2003`: Foreign key constraint violation
- `P2016`: Query interpretation error

**Rules**:
- **USE select** to limit fields (performance)
- **USE include** for relations (but be careful with N+1)
- **ALWAYS paginate** list endpoints
- **HANDLE Prisma errors** with type guards
- **USE transactions** for multi-table operations
- **COUNT separately** for pagination (use Promise.all)

---

## 6️⃣ Error Handling

### Custom Exceptions

```typescript
// ✅ CORRECT - Typed exception with error code
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@cigar-platform/types';

export class ClubNotFoundException extends HttpException {
  constructor(clubId: string) {
    super(
      {
        code: ErrorCode.CLUB_NOT_FOUND,
        message: 'Club not found',
        details: `Club with id ${clubId} does not exist`,
      },
      HttpStatus.NOT_FOUND
    );
  }
}

export class ClubAlreadyExistsException extends HttpException {
  constructor(clubName: string) {
    super(
      {
        code: ErrorCode.CLUB_ALREADY_EXISTS,
        message: 'Club already exists',
        details: `A club with name "${clubName}" already exists`,
      },
      HttpStatus.CONFLICT
    );
  }
}
```

### Usage in Services

```typescript
// ✅ CORRECT - Throw typed exceptions
async findOne(id: string): Promise<ClubResponseDto> {
  const club = await this.prisma.club.findUnique({ where: { id } });

  if (!club) {
    throw new ClubNotFoundException(id);  // ✅ Typed
  }

  return this.mapToResponse(club);
}

// ❌ INCORRECT - Generic error
async findOne(id: string): Promise<ClubResponseDto> {
  const club = await this.prisma.club.findUnique({ where: { id } });

  if (!club) {
    throw new Error('Club not found');  // ❌ Generic
  }

  return club;
}
```

**Rules**:
- **ALWAYS use typed exceptions** (never generic Error)
- **INCLUDE error codes** (for frontend handling)
- **PROVIDE details** (helpful error messages)
- **USE proper HTTP status** (404, 400, 409, etc.)
- **CATCH and transform** Prisma errors

---

## 7️⃣ Common Patterns

### Soft Deletes

```typescript
// Prisma schema
model Club {
  id        String    @id @default(cuid())
  name      String
  deletedAt DateTime? // ✅ Soft delete flag
}

// Service
async remove(id: string): Promise<void> {
  await this.findOne(id); // Verify exists

  await this.prisma.club.update({
    where: { id },
    data: { deletedAt: new Date() }, // ✅ Soft delete
  });

  this.logger.log(`Club soft-deleted: ${id}`);
}

// Filter out deleted in queries
async findAll(): Promise<ClubResponseDto[]> {
  const clubs = await this.prisma.club.findMany({
    where: { deletedAt: null }, // ✅ Exclude deleted
  });

  return clubs.map(club => this.mapToResponse(club));
}
```

### Timestamps

```typescript
// ✅ Prisma handles automatically
model Club {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())  // ✅ Auto-generated
  updatedAt DateTime @updatedAt       // ✅ Auto-updated
}

// No need to set these manually in services!
```

---

## 8️⃣ Checklist

### Before Creating a New Module

- [ ] Define DTOs (Create, Update, Response, Filter)
- [ ] Create custom exceptions
- [ ] Plan Prisma queries (select, include, pagination)
- [ ] Add Swagger decorators
- [ ] Implement mapper to ResponseDto

### Before Committing

- [ ] All endpoints have Swagger docs
- [ ] All DTOs have validation decorators
- [ ] Errors use typed exceptions
- [ ] No Prisma entities exposed directly
- [ ] Pagination implemented for list endpoints
- [ ] Logger used for important operations

---

**Last Updated**: December 20, 2024