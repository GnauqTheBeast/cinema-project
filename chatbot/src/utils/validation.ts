import he from 'he';

export const MaxQuestionLength = 1000;
export const MaxTitleLength = 200;
export const MinQuestionLength = 3;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Suspicious patterns that might indicate injection attempts
const suspiciousPatterns = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  /eval\s*\(/gi,
  /document\./gi,
  /window\./gi,
];

// SQL injection patterns
const sqlInjectionPatterns = [
  /(union\s+select|select\s+.*\s+from|insert\s+into|delete\s+from|update\s+.*\s+set)/gi,
  /(drop\s+table|drop\s+database|truncate\s+table)/gi,
  /(exec\s*\(|execute\s*\(|sp_executesql)/gi,
  /(;|\s+or\s+1\s*=\s*1|'\s*or\s*'1'\s*=\s*'1)/gi,
];

// Command injection patterns
const commandInjectionPatterns = [
  /(&&|\|\||;|\||`)/gi,
  /(rm\s+-rf|del\s+\/|format\s+c:)/gi,
  /(wget\s+|curl\s+|nc\s+|netcat\s+)/gi,
  /(\$\(|\$\{|`.*`)/gi,
];

// Prompt injection patterns
const promptInjectionPatterns = [
  /(bỏ\s+qua|ignore).*?(hướng\s+dẫn|instructions?|previous|above)/gi,
  /(disregard|forget).*?(instructions?|above|previous|system)/gi,
  /(trả\s+về|return).*?(toàn\s+bộ|all).*?(hướng\s+dẫn|prompt|instructions?)/gi,
  /(đặc\s+biệt|special|important).*?(bỏ\s+qua|ignore|skip)/gi,
  /system\s+(prompt|instructions?|role)/gi,
  /reveal.*?(prompt|instructions?|system)/gi,
  /show.*?(prompt|instructions?|system)/gi,
  /tell\s+me.*?(prompt|instructions?|system)/gi,
  /(override|bypass|circumvent).*?(security|safety|instructions?)/gi,
  /act\s+as.*?(different|another|new)\s+(role|character|assistant)/gi,
  /pretend.*?(you\s+are|to\s+be).*?(different|another|new)/gi,
  /you\s+are\s+now.*?(jailbreak|unrestricted|without\s+limits)/gi,
  /(simulation|roleplay|game)\s+mode/gi,
  /developer\s+(mode|override|access)/gi,
  /---+\s*(end|stop|break|terminate)/gi,
  /(end\s+of\s+prompt|prompt\s+ends?\s+here)/gi,
  /đặc\s+biệt.*?skip.*?hướng\s+dẫn/gi,
  /(làm\s+theo|follow).*?(yêu\s+cầu|request).*?(tối\s+cao|supreme|highest)/gi,
  /(bạn\s+phải|you\s+must).*?(nói\s+là|say).*?tôi\s+là\s+ai/gi,
  /skip.*?(hướng\s+dẫn|instructions?|above|previous)/gi,
  /(tối\s+cao|supreme|highest).*?(yêu\s+cầu|request|command)/gi,
  /không\s+nói.*?bất\s+kỳ.*?câu.*?khác/gi,
];

export function validateQuestion(question: string): string {
  if (!question) {
    throw new ValidationError('Input is empty');
  }

  // Trim whitespace
  question = question.trim();

  if (question.length === 0) {
    throw new ValidationError('Input is empty');
  }

  // Check length constraints
  if (question.length < MinQuestionLength) {
    throw new ValidationError('Input is too short');
  }

  if (question.length > MaxQuestionLength) {
    throw new ValidationError('Input exceeds maximum length');
  }

  // Check for suspicious content
  checkSuspiciousContent(question);

  // Sanitize the input
  const sanitized = sanitizeInput(question);

  return sanitized;
}

export function validateTitle(title: string): string {
  if (!title) {
    throw new ValidationError('Input is empty');
  }

  title = title.trim();

  if (title.length === 0) {
    throw new ValidationError('Input is empty');
  }

  if (title.length > MaxTitleLength) {
    throw new ValidationError('Input exceeds maximum length');
  }

  // Check for suspicious content (less strict for titles)
  checkBasicSuspiciousContent(title);

  // Sanitize the title
  const sanitized = sanitizeInput(title);

  return sanitized;
}

function checkSuspiciousContent(input: string): void {
  // Check for XSS patterns
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      throw new ValidationError('Input contains suspicious content');
    }
  }

  // Check for SQL injection patterns
  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(input)) {
      throw new ValidationError('Input contains suspicious content');
    }
  }

  // Check for command injection patterns
  for (const pattern of commandInjectionPatterns) {
    if (pattern.test(input)) {
      throw new ValidationError('Input contains suspicious content');
    }
  }

  // Check for prompt injection patterns
  for (const pattern of promptInjectionPatterns) {
    if (pattern.test(input)) {
      throw new ValidationError('Input contains suspicious content');
    }
  }
}

function checkBasicSuspiciousContent(input: string): void {
  // Only check for most obvious XSS patterns for titles
  const basicPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
  ];

  for (const pattern of basicPatterns) {
    if (pattern.test(input)) {
      throw new ValidationError('Input contains suspicious content');
    }
  }
}

function sanitizeInput(input: string): string {
  // HTML escape to prevent XSS
  let sanitized = he.encode(input);

  // Remove control characters except for common whitespace
  sanitized = removeControlCharacters(sanitized);

  // Normalize whitespace
  sanitized = normalizeWhitespace(sanitized);

  return sanitized;
}

function removeControlCharacters(input: string): string {
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function normalizeWhitespace(input: string): string {
  // Replace multiple spaces with single space
  const normalized = input.replace(/\s+/g, ' ');

  // Trim leading and trailing whitespace
  return normalized.trim();
}

export function validateAndSanitizeContext(context: string): string {
  if (context.length > 10000) {
    throw new ValidationError('Input exceeds maximum length');
  }

  // Light sanitization for context (less strict than user input)
  let sanitized = he.encode(context);
  sanitized = removeControlCharacters(sanitized);

  return sanitized;
}

export function isValidFileExtension(filename: string, allowedExtensions: string[]): boolean {
  if (!filename) {
    return false;
  }

  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return false;
  }

  const ext = filename.substring(lastDot).toLowerCase();

  for (const allowed of allowedExtensions) {
    if (ext === allowed.toLowerCase()) {
      return true;
    }
  }

  return false;
}

export function sanitizeFilename(filename: string): string {
  // Remove path separators and other dangerous characters
  const dangerous = ['/', '\\', '..', ':', '*', '?', '"', '<', '>', '|', '\x00'];

  let sanitized = filename;
  for (const char of dangerous) {
    sanitized = sanitized.replace(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '_');
  }

  // Limit filename length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }

  // Ensure filename doesn't start with dot or dash
  sanitized = sanitized.replace(/^\./, '');
  sanitized = sanitized.replace(/^-/, '');

  // If empty after sanitization, provide default
  if (!sanitized) {
    sanitized = 'unnamed_file';
  }

  return sanitized;
}
