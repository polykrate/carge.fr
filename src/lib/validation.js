/**
 * Validation schemas using Zod
 * Provides type-safe validation for all user inputs
 */

import { z } from 'zod';

/**
 * File upload validation
 */
export const fileSchema = z.object({
  file: z.instanceof(File, {
    message: 'Please select a valid file',
  }).refine(
    (file) => file.size > 0,
    'File cannot be empty'
  ).refine(
    (file) => file.size <= 50 * 1024 * 1024, // 50MB max
    'File size must be less than 50MB'
  ),
});

/**
 * Proof JSON validation
 */
export const proofSchema = z.object({
  ragData: z.record(z.unknown()).optional(),
  data: z.record(z.unknown()).optional(),
  metadata: z.object({
    creator: z.string(),
    timestamp: z.number().optional(),
    signature: z.string(),
  }).optional(),
  signature: z.string().optional(),
  contentHash: z.string().regex(/^0x[0-9a-f]+$/i, 'Invalid hash format'),
}).refine(
  (data) => data.ragData || data.data || data.contentHash,
  'Proof must contain ragData, data, or contentHash'
);

/**
 * Hash validation (0x prefixed hex string)
 */
export const hashSchema = z.string()
  .regex(/^0x[0-9a-f]{64}$/i, 'Hash must be a 32-byte hex string (0x + 64 hex chars)');

/**
 * Substrate address validation (SS58 format)
 */
export const addressSchema = z.string()
  .min(47, 'Address too short')
  .max(48, 'Address too long')
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, 'Invalid address format');

/**
 * Block number validation
 */
export const blockNumberSchema = z.number()
  .int('Block number must be an integer')
  .positive('Block number must be positive')
  .max(999999999, 'Block number too large');

/**
 * Signature validation (0x prefixed hex string, 130 chars)
 */
export const signatureSchema = z.string()
  .regex(/^0x[0-9a-f]{128}$/i, 'Signature must be a 64-byte hex string (0x + 128 hex chars)');

/**
 * CID validation (IPFS Content Identifier)
 */
export const cidSchema = z.string()
  .regex(/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}|baf[a-z0-9]{56,})$/, 'Invalid CID format');

/**
 * Workflow form validation
 */
export const workflowFormSchema = z.object({
  fields: z.record(z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.unknown()),
  ])),
}).refine(
  (data) => Object.keys(data.fields).length > 0,
  'Form must have at least one field'
);

/**
 * Quick Sign form validation
 */
export const quickSignSchema = z.object({
  file: z.instanceof(File, {
    message: 'Please select a file',
  }).refine(
    (file) => file.size > 0,
    'File cannot be empty'
  ).refine(
    (file) => file.size <= 100 * 1024 * 1024, // 100MB max for signing
    'File size must be less than 100MB'
  ),
  account: addressSchema,
});

/**
 * Verify form validation
 */
export const verifyFormSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('file'),
    file: fileSchema.shape.file,
  }),
  z.object({
    type: z.literal('json'),
    json: z.string().min(1, 'JSON cannot be empty'),
  }),
]);

/**
 * Helper function to safely validate data
 */
export const validate = (schema, data) => {
  try {
    const result = schema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : null,
      errors: result.success ? [] : (result.error?.errors || result.error?.issues || []).map(err => ({
        path: err.path?.join('.') || 'unknown',
        message: err.message || 'Validation error',
      })),
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: [{ path: '', message: error.message }],
    };
  }
};

/**
 * Helper to format validation errors for display
 */
export const formatValidationErrors = (errors) => {
  return errors.map(err => `${err.path ? err.path + ': ' : ''}${err.message}`).join('\n');
};

