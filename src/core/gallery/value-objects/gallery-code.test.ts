import { describe, it, expect } from 'vitest';
import { GalleryCode } from './gallery-code';

describe('GalleryCode', () => {
  describe('create', () => {
    it('should create valid gallery code', () => {
      const result = GalleryCode.create('SCDY0028');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe('SCDY0028');
      }
    });

    it('should normalize to uppercase', () => {
      const result = GalleryCode.create('scdy0028');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe('SCDY0028');
      }
    });

    it('should reject empty code', () => {
      const result = GalleryCode.create('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('cannot be empty');
      }
    });

    it('should reject code shorter than 4 characters', () => {
      const result = GalleryCode.create('ABC');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('4-12 alphanumeric');
      }
    });

    it('should reject code longer than 12 characters', () => {
      const result = GalleryCode.create('ABCDEFGHIJKLM');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('4-12 alphanumeric');
      }
    });

    it('should reject code with special characters', () => {
      const result = GalleryCode.create('ABC-123');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('alphanumeric');
      }
    });

    it('should trim whitespace', () => {
      const result = GalleryCode.create('  SCDY0028  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe('SCDY0028');
      }
    });
  });

  describe('generate', () => {
    it('should generate code with prefix', () => {
      const code = GalleryCode.generate('SCDY');
      expect(code.value).toMatch(/^SCDY[A-Z0-9]{4}$/);
    });

    it('should generate code without prefix', () => {
      const code = GalleryCode.generate();
      expect(code.value).toMatch(/^[A-Z0-9]{4}$/);
    });

    it('should normalize prefix to uppercase', () => {
      const code = GalleryCode.generate('test');
      expect(code.value).toMatch(/^TEST[A-Z0-9]{4}$/);
    });

    it('should truncate long codes to 12 characters', () => {
      const code = GalleryCode.generate('VERYLONGPREFIX');
      expect(code.value.length).toBeLessThanOrEqual(12);
    });
  });

  describe('value getter', () => {
    it('should return the code value', () => {
      const result = GalleryCode.create('TEST1234');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe('TEST1234');
      }
    });
  });
});
