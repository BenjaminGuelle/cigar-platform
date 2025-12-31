import { PartialType } from '@nestjs/swagger';
import { CreateTastingDto } from './create-tasting.dto';

/**
 * DTO for updating a tasting (auto-save during DRAFT)
 *
 * All fields from CreateTastingDto are optional
 * Only works on DRAFT tastings (COMPLETED tastings are immutable)
 */
export class UpdateTastingDto extends PartialType(CreateTastingDto) {}
