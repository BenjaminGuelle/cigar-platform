/**
 * Image preset type
 * Defines different image types used across the platform
 */
export type ImagePresetType = 'avatar' | 'event' | 'cigar' | 'feed' | 'cover';

/**
 * Image processing configuration
 */
export interface ImagePresetConfig {
  width: number;
  height: number;
  quality: number;
  bucket: string;
  fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Image presets for different use cases
 * All Stars 2026 - Optimized for quality and performance
 */
export const IMAGE_PRESETS: Record<ImagePresetType, ImagePresetConfig> = {
  /**
   * User avatar
   * Square format, high quality for profile pictures
   */
  avatar: {
    width: 256,
    height: 256,
    quality: 90,
    bucket: 'avatars',
    fit: 'cover',
  },

  /**
   * Event photos
   * Landscape format for group photos and event coverage
   */
  event: {
    width: 1200,
    height: 800,
    quality: 85,
    bucket: 'events',
    fit: 'cover',
  },

  /**
   * Cigar/Humidor photos
   * Square format for product shots
   */
  cigar: {
    width: 600,
    height: 600,
    quality: 85,
    bucket: 'cigars',
    fit: 'cover',
  },

  /**
   * Feed/Social posts
   * Instagram-style square format
   */
  feed: {
    width: 1080,
    height: 1080,
    quality: 85,
    bucket: 'feed',
    fit: 'cover',
  },

  /**
   * Club/Event cover images
   * Wide banner format for headers
   */
  cover: {
    width: 1920,
    height: 400,
    quality: 80,
    bucket: 'covers',
    fit: 'cover',
  },
};

/**
 * Maximum file size allowed for uploads (5MB)
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Allowed MIME types for image uploads
 */
export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;