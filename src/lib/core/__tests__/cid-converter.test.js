import { describe, it, expect } from 'vitest';
import { CidConverter } from '../cid-converter';

describe('CidConverter', () => {
  describe('hexToString', () => {
    it('should convert hex to CID string', () => {
      // CIDv1 with raw codec and sha256
      const hexCid = '0x01551220b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';
      
      const cidString = CidConverter.hexToString(hexCid);
      
      expect(cidString).toBeDefined();
      expect(cidString).toMatch(/^baf[a-z0-9]+$/); // Accept both bafkrei and bafy
    });

    it('should handle hex without 0x prefix', () => {
      const hexCid = '01551220b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';
      
      const cidString = CidConverter.hexToString(hexCid);
      
      expect(cidString).toBeDefined();
    });

    it('should throw on invalid hex', () => {
      expect(() => CidConverter.hexToString('invalid')).toThrow();
    });
  });

  describe('stringToHex', () => {
    it('should convert CID string to hex', () => {
      const cidString = 'bafkreieq5jui4j25lacwomsqgjeswwl3y5zcdrresptwgmfylxo2depppq';
      
      const hexCid = CidConverter.stringToHex(cidString);
      
      expect(hexCid).toMatch(/^0x[0-9a-f]+$/);
      expect(hexCid.length).toBeGreaterThan(2);
    });

    it('should throw on invalid CID', () => {
      expect(() => CidConverter.stringToHex('invalid-cid')).toThrow();
    });
  });

  describe('roundtrip conversion', () => {
    it('should maintain data integrity in hex->CID->hex conversion', () => {
      const originalHex = '0x01551220b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';
      
      const cidString = CidConverter.hexToString(originalHex);
      const convertedHex = CidConverter.stringToHex(cidString);
      
      expect(convertedHex.toLowerCase()).toBe(originalHex.toLowerCase());
    });
  });

  describe('isValid', () => {
    it('should validate correct CID', () => {
      const cidString = 'bafkreieq5jui4j25lacwomsqgjeswwl3y5zcdrresptwgmfylxo2depppq';
      
      const isValid = CidConverter.isValid(cidString);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid CID', () => {
      const isValid = CidConverter.isValid('invalid-cid');
      
      expect(isValid).toBe(false);
    });
  });
});

