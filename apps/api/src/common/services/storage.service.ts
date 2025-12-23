import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../auth/supabase.service';
import sharp from 'sharp';
import {
  ImagePresetType,
  IMAGE_PRESETS,
  ImagePresetConfig,
} from '../config/image-presets.config';

/**
 * Upload options for image processing
 */
export interface ImageUploadOptions {
  /**
   * Add watermark to image (future feature)
   */
  watermark?: boolean;

  /**
   * Custom filename (optional, will generate timestamp-based name if not provided)
   */
  filename?: string;
}

/**
 * Generic Storage Service
 * Handles all image uploads across the platform with preset configurations
 * All Stars 2026 - Scalable, type-safe, and optimized
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Upload image with preset configuration
   * Automatically resizes, optimizes, and stores in appropriate bucket
   *
   * @param preset - Image preset type (avatar, event, cigar, feed, cover)
   * @param entityId - Entity identifier (userId, eventId, cigarId, etc.)
   * @param buffer - Original image buffer
   * @param options - Optional upload configuration
   * @returns Public URL of uploaded image
   *
   * @example
   * // Upload user avatar
   * const url = await storageService.uploadImage('avatar', userId, buffer);
   *
   * @example
   * // Upload event photo with custom filename
   * const url = await storageService.uploadImage('event', eventId, buffer, {
   *   filename: 'group-photo.jpg'
   * });
   */
  async uploadImage(
    preset: ImagePresetType,
    entityId: string,
    buffer: Buffer,
    options?: ImageUploadOptions
  ): Promise<string> {
    const config = IMAGE_PRESETS[preset];

    this.logger.log(
      `Uploading ${preset} image for entity ${entityId} (${config.width}x${config.height})`
    );

    // Process image with sharp
    const processedBuffer = await this.processImage(buffer, config);

    // Generate filename
    const filename = options?.filename || `${preset}-${Date.now()}.jpg`;
    const filePath = `${entityId}/${filename}`;

    // Upload to Supabase Storage (using admin client to bypass RLS)
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase.storage
      .from(config.bucket)
      .upload(filePath, processedBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      this.logger.error(
        `Failed to upload ${preset} image: ${error.message}`,
        error
      );
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(config.bucket).getPublicUrl(data.path);

    this.logger.log(`${preset} image uploaded successfully: ${publicUrl}`);
    return publicUrl;
  }

  /**
   * Delete image from storage
   * Extracts bucket and path from URL and removes the file
   *
   * @param imageUrl - Full public URL of the image
   *
   * @example
   * await storageService.deleteImage(user.avatarUrl);
   */
  async deleteImage(imageUrl: string | null): Promise<void> {
    if (!imageUrl) {
      return;
    }

    try {
      // Parse URL to extract bucket and path
      // URL format: https://xxx.supabase.co/storage/v1/object/public/{bucket}/{path}
      const match = imageUrl.match(/\/object\/public\/([^/]+)\/(.+)/);

      if (!match) {
        this.logger.warn(`Invalid image URL format: ${imageUrl}`);
        return;
      }

      const [, bucket, filePath] = match;

      this.logger.log(`Deleting image from ${bucket}: ${filePath}`);

      const supabase = this.supabaseService.getAdminClient();
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        this.logger.warn(`Failed to delete image: ${error.message}`);
        // Don't throw - deletion failure shouldn't block operations
      } else {
        this.logger.log(`Image deleted successfully`);
      }
    } catch (error) {
      this.logger.warn(`Error deleting image: ${error}`);
      // Don't throw - deletion failure shouldn't block operations
    }
  }

  /**
   * Delete all images for an entity in a specific bucket
   * Useful for cleanup when deleting entities (user, event, etc.)
   *
   * @param preset - Image preset type (determines bucket)
   * @param entityId - Entity identifier
   *
   * @example
   * // Delete all user avatars
   * await storageService.deleteAllImages('avatar', userId);
   *
   * @example
   * // Delete all event photos
   * await storageService.deleteAllImages('event', eventId);
   */
  async deleteAllImages(
    preset: ImagePresetType,
    entityId: string
  ): Promise<void> {
    const config = IMAGE_PRESETS[preset];

    try {
      // List all files for entity
      const supabase = this.supabaseService.getAdminClient();
      const { data: files, error: listError } = await supabase.storage
        .from(config.bucket)
        .list(entityId);

      if (listError || !files || files.length === 0) {
        return;
      }

      // Build file paths
      const filePaths = files.map((file) => `${entityId}/${file.name}`);

      this.logger.log(
        `Deleting ${filePaths.length} ${preset} images for entity ${entityId}`
      );

      // Delete all files
      const { error } = await supabase.storage
        .from(config.bucket)
        .remove(filePaths);

      if (error) {
        this.logger.warn(`Failed to delete images: ${error.message}`);
      } else {
        this.logger.log(
          `Successfully deleted ${filePaths.length} ${preset} images`
        );
      }
    } catch (error) {
      this.logger.warn(`Error deleting images: ${error}`);
    }
  }

  /**
   * Process image with sharp according to preset configuration
   * - Resize to preset dimensions
   * - Convert to JPEG
   * - Optimize quality
   * - Apply mozjpeg compression
   *
   * @private
   */
  private async processImage(
    buffer: Buffer,
    config: ImagePresetConfig
  ): Promise<Buffer> {
    return sharp(buffer)
      .resize(config.width, config.height, {
        fit: config.fit,
        position: 'center',
      })
      .jpeg({
        quality: config.quality,
        mozjpeg: true, // Use mozjpeg for better compression
      })
      .toBuffer();
  }

  /**
   * Get image metadata (dimensions, format, size)
   * Useful for validation and debugging
   *
   * @param buffer - Image buffer
   * @returns Image metadata
   */
  async getImageMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    return sharp(buffer).metadata();
  }
}