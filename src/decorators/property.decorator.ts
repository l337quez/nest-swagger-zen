import { ApiProperty, ApiPropertyOptions, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Envoltorio para @ApiProperty de Swagger.
 * Centraliza la importación en tu librería y te permite forzar reglas
 * corporativas en el futuro (ej. forzar descripciones obligatorias).
 */
export function ZenProperty(options?: ApiPropertyOptions) {
  return ApiProperty(options);
}

/**
 * Envoltorio para @ApiPropertyOptional de Swagger.
 * Ideal para campos que no son requeridos en el payload o base de datos.
 */
export function ZenPropertyOptional(options?: ApiPropertyOptions) {
  return ApiPropertyOptional(options);
}
