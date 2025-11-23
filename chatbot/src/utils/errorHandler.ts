/**
 * Database error handling utilities
 */

export class DatabaseError extends Error {
    constructor(
        message: string,
        public readonly originalError?: unknown,
    ) {
        super(message)
        this.name = 'DatabaseError'
        Error.captureStackTrace(this, DatabaseError)
    }
}

/**
 * Wraps database errors with contextual information
 * @param action - The action being performed (e.g., "Failed to create document")
 * @param error - The original error
 * @returns DatabaseError with formatted message
 */
export function wrapDatabaseError(action: string, error: unknown): DatabaseError {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new DatabaseError(`${action}: ${message}`, error)
}

/**
 * Checks if an error is a not found error (ENOENT)
 */
export function isFileNotFoundError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && 'code' in error && (error as any).code === 'ENOENT'
}
