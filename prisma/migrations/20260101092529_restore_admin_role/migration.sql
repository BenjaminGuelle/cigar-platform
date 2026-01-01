-- Migration: Restore ADMIN role to Role enum
-- Date: 2026-01-01
-- Reason: Simplify architecture by supporting both ADMIN and SUPER_ADMIN
--         This avoids complex mapping and Supabase migration issues
--
-- Role hierarchy:
-- SUPER_ADMIN: Platform super admin (full control + platform config)
-- ADMIN: Platform admin (full access except platform config)
-- MODERATOR: Content moderation
-- USER: Standard user

-- Add 'ADMIN' to Role enum (between SUPER_ADMIN and MODERATOR)
-- PostgreSQL enums don't support position control, but order doesn't matter for functionality
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN';