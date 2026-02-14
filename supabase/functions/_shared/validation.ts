// Shared input validation utilities for edge functions

export const MAX_DOMAIN_LENGTH = 100;
export const MAX_TEXT_LENGTH = 10000;
export const MAX_MESSAGE_LENGTH = 5000;
export const MAX_QUESTION_LENGTH = 2000;
export const MAX_NAME_LENGTH = 100;
export const MAX_ANSWER_LENGTH = 5000;
export const MAX_COUNT = 100;
export const DOMAIN_REGEX = /^[a-zA-Z0-9\s\-\/\.\+\#\&]+$/;
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateDomain(domain: unknown): { valid: boolean; error?: string; value?: string } {
  if (!domain || typeof domain !== 'string') {
    return { valid: false, error: 'Domain is required and must be a string' };
  }
  const trimmed = domain.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_DOMAIN_LENGTH) {
    return { valid: false, error: `Domain must be 1-${MAX_DOMAIN_LENGTH} characters` };
  }
  if (!DOMAIN_REGEX.test(trimmed)) {
    return { valid: false, error: 'Domain contains invalid characters' };
  }
  return { valid: true, value: trimmed };
}

export function validateString(value: unknown, fieldName: string, maxLength: number, required = true): { valid: boolean; error?: string; value?: string } {
  if (!value || typeof value !== 'string') {
    if (required) return { valid: false, error: `${fieldName} is required and must be a string` };
    return { valid: true, value: '' };
  }
  const trimmed = value.trim();
  if (required && trimmed.length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }
  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must be at most ${maxLength} characters` };
  }
  return { valid: true, value: trimmed };
}

export function validateCount(count: unknown, defaultVal: number, max: number = MAX_COUNT): number {
  if (typeof count !== 'number' || !Number.isFinite(count) || count < 1) return defaultVal;
  return Math.min(Math.floor(count), max);
}

export function validateUUID(id: unknown, fieldName: string): { valid: boolean; error?: string } {
  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return { valid: false, error: `${fieldName} must be a valid UUID` };
  }
  return { valid: true };
}

export function validationError(message: string, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
