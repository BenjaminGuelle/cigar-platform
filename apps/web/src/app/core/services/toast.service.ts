import { Injectable } from '@angular/core';
import { toast } from 'ngx-sonner';

/**
 * Toast Service
 * Centralized wrapper for ngx-sonner toast notifications
 *
 * Provides a consistent API for displaying toast messages throughout the app.
 * Uses ngx-sonner (Angular port of Sonner by Vercel)
 *
 * @example
 * ```typescript
 * constructor(private toastService: ToastService) {}
 *
 * onSuccess() {
 *   this.toastService.success('Profile updated successfully');
 * }
 *
 * onError() {
 *   this.toastService.error('Failed to update profile');
 * }
 *
 * async uploadFile() {
 *   const toastId = this.toastService.loading('Uploading...');
 *   try {
 *     await this.upload();
 *     this.toastService.success('Upload complete', { id: toastId });
 *   } catch (error) {
 *     this.toastService.error('Upload failed', { id: toastId });
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  /**
   * Display a success toast
   */
  success(message: string, options?: any): string | number {
    return toast.success(message, options);
  }

  /**
   * Display an error toast
   */
  error(message: string, options?: any): string | number {
    return toast.error(message, options);
  }

  /**
   * Display an info toast
   */
  info(message: string, options?: any): string | number {
    return toast.info(message, options);
  }

  /**
   * Display a warning toast
   */
  warning(message: string, options?: any): string | number {
    return toast.warning(message, options);
  }

  /**
   * Display a loading toast
   * Returns the toast ID that can be used to update/dismiss it later
   */
  loading(message: string, options?: any): string | number {
    return toast.loading(message, options);
  }

  /**
   * Display a promise toast
   * Automatically shows loading/success/error based on promise state
   */
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ): void {
    toast.promise(promise, messages);
  }

  /**
   * Dismiss a specific toast by ID
   */
  dismiss(toastId?: string | number): void {
    toast.dismiss(toastId);
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    toast.dismiss();
  }
}
