import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Security patterns to prevent XSS and external links injection
 */
const SECURITY_PATTERNS = [
  // Anti-XSS: Script injections
  /<script|javascript:|onerror=|onload=|onclick=|eval\(/gi,

  // Anti-spam: External links (excluding our domain)
  /(http|https):\/\/(?!.*cigar-platform\.)/gi,
];

/**
 * Custom validator decorator: @IsSecureText()
 *
 * Validates that text content is secure (no XSS, no external links)
 * Does NOT handle content moderation (profanity/insults) - use user reporting for that
 *
 * Usage:
 * ```typescript
 * @IsSecureText()
 * @IsString()
 * name: string;
 * ```
 */
export function IsSecureText(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSecureText',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          // Null/undefined/empty are handled by @IsOptional or @IsNotEmpty
          if (value === null || value === undefined || value === '') {
            return true;
          }

          // Must be a string
          if (typeof value !== 'string') {
            return false;
          }

          // Check against security patterns
          for (const pattern of SECURITY_PATTERNS) {
            if (pattern.test(value)) {
              return false;
            }
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `Le champ "${args.property}" contient du contenu non autorisé`;
        },
      },
    });
  };
}
