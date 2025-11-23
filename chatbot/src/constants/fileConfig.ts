/**
 * File upload and processing configuration constants
 */

export const FILE_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
    ALLOWED_EXTENSIONS: ['.txt', '.md', '.pdf'] as const,
    UPLOAD_DIR: 'uploads',
} as const

export const PAGINATION_CONFIG = {
    MAX_LIMIT: 100,
    DEFAULT_LIMIT: 10,
    DEFAULT_OFFSET: 0,
} as const

export const CHUNK_CONFIG = {
    MAX_SIZE: 800,
    OVERLAP: 100,
    MIN_SIZE: 50,
    METHOD: 'sentence' as const,
    SEPARATORS: ['\n\n', '\n', '. ', '! ', '? '] as const,
} as const
