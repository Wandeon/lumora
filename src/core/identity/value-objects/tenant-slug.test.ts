import { describe, it, expect } from 'vitest';
import { TenantSlug } from './tenant-slug';

describe('TenantSlug', () => {
  describe('create', () => {
    it('should create valid slug', () => {
      const result = TenantSlug.create('my-studio');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe('my-studio');
      }
    });

    it('should normalize to lowercase', () => {
      const result = TenantSlug.create('My-Studio');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe('my-studio');
      }
    });

    it('should reject reserved slugs', () => {
      const reservedSlugs = ['www', 'api', 'admin', 'app', 'dashboard'];
      for (const slug of reservedSlugs) {
        const result = TenantSlug.create(slug);
        expect(result.success).toBe(false);
      }
    });

    it('should reject all reserved slugs', () => {
      const allReservedSlugs = [
        'www',
        'api',
        'app',
        'admin',
        'dashboard',
        'login',
        'signup',
        'auth',
        'static',
        'assets',
        'cdn',
        'mail',
        'email',
        'support',
        'help',
        'docs',
        'blog',
        'status',
      ];
      for (const slug of allReservedSlugs) {
        const result = TenantSlug.create(slug);
        expect(result.success).toBe(false);
      }
    });

    it('should reject slug shorter than 3 characters', () => {
      const result = TenantSlug.create('ab');
      expect(result.success).toBe(false);
    });

    it('should reject slug with invalid characters', () => {
      const result = TenantSlug.create('my_studio');
      expect(result.success).toBe(false);
    });

    it('should reject empty slug', () => {
      const result = TenantSlug.create('');
      expect(result.success).toBe(false);
    });

    it('should reject slug longer than 63 characters', () => {
      const longSlug = 'a'.repeat(64);
      const result = TenantSlug.create(longSlug);
      expect(result.success).toBe(false);
    });

    it('should accept slug with numbers', () => {
      const result = TenantSlug.create('studio123');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe('studio123');
      }
    });

    it('should accept slug starting with number', () => {
      const result = TenantSlug.create('123studio');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe('123studio');
      }
    });

    it('should accept minimum length slug (3 characters)', () => {
      const result = TenantSlug.create('abc');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe('abc');
      }
    });

    it('should accept maximum length slug (63 characters)', () => {
      const maxSlug = 'a'.repeat(63);
      const result = TenantSlug.create(maxSlug);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe(maxSlug);
      }
    });

    it('should trim whitespace', () => {
      const result = TenantSlug.create('  my-studio  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe('my-studio');
      }
    });

    it('should reject slug starting with hyphen', () => {
      const result = TenantSlug.create('-my-studio');
      expect(result.success).toBe(false);
    });

    it('should reject slug ending with hyphen', () => {
      const result = TenantSlug.create('my-studio-');
      expect(result.success).toBe(false);
    });
  });

  describe('fromString', () => {
    it('should create slug from string', () => {
      const result = TenantSlug.fromString('my-studio');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe('my-studio');
      }
    });

    it('should apply same validation as create', () => {
      const result = TenantSlug.fromString('ab');
      expect(result.success).toBe(false);
    });
  });

  describe('value getter', () => {
    it('should return the slug value', () => {
      const result = TenantSlug.create('test-studio');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe('test-studio');
      }
    });
  });
});
