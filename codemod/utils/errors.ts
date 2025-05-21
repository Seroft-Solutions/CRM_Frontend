export class CodemodError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public entityName?: string
  ) {
    super(message);
    this.name = 'CodemodError';
  }
}

export enum ErrorCode {
  // Template errors
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  TEMPLATE_INVALID = 'TEMPLATE_INVALID',
  
  // Entity errors
  ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
  ENTITY_INVALID = 'ENTITY_INVALID',
  ENTITY_FIELD_INVALID = 'ENTITY_FIELD_INVALID',
  ENTITY_RELATIONSHIP_INVALID = 'ENTITY_RELATIONSHIP_INVALID',
  
  // File system errors
  OUTPUT_DIR_ERROR = 'OUTPUT_DIR_ERROR',
  WRITE_ERROR = 'WRITE_ERROR',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Runtime errors
  RUNTIME_ERROR = 'RUNTIME_ERROR'
}

export function formatError(error: unknown): string {
  if (error instanceof CodemodError) {
    const parts = [`${error.name} [${error.code}]:`];
    if (error.entityName) {
      parts.push(`Entity '${error.entityName}':`);
    }
    parts.push(error.message);
    return parts.join(' ');
  }
  
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  
  return `Unknown error: ${String(error)}`;
}

export function throwError(
  message: string,
  code: ErrorCode,
  entityName?: string
): never {
  throw new CodemodError(message, code, entityName);
}
