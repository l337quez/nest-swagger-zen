import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { ApiParamOptions } from '@nestjs/swagger/dist/decorators/api-param.decorator';
import { ApiQueryOptions } from '@nestjs/swagger/dist/decorators/api-query.decorator';

/**
 * Interface para la configuración esquematizada de Swagger.
 * Esto reemplaza la declaración manual de objetos JSON en tus módulos.
 */
export interface ZenSwaggerConfig {
  /** Un resumen breve del endpoint */
  summary: string;
  /** Detalles extendidos del endpoint */
  description?: string;
  /** Marca el endpoint como obsoleto (aparecerá tachado) */
  deprecated?: boolean;
  /** Status code a devolver en caso de éxito (por defecto 200 o 201) */
  status?: number;
  /** La clase DTO que representa el body de la petición (si aplica) */
  body?: Type<any>;
  /** La clase DTO que se responde en caso de éxito */
  response?: Type<any>;
  /** Un mensaje o valor de ejemplo directo si no quieres usar un DTO de respuesta */
  example?: any;
  /** Documenta automáticamente parámetros de paginación (page y limit) */
  isPaginated?: boolean;
  /** Documenta si este endpoint requiere envío de token de Autorización (JWT Bearer Auth) */
  isBearerAuth?: boolean;
  /** Arreglo para definir parámetros de ruta explícitos (e.g. /:id) */
  params?: ApiParamOptions[];
  /** Arreglo para definir variables libres que viajen por Query string (?foo=bar) */
  queries?: ApiQueryOptions[];
  /** Tipos de contenido que acepta (ej: ['multipart/form-data'] para archivos) */
  consumes?: string[];
  /** Si está en true, oculta completamente el endpoint de la interfaz de Swagger */
  exclude?: boolean;
}

/**
 * Decorador genérico y estilizado que simplifica la configuración de Swagger en tus controladores.
 * Aplica en cadena todos los metadatos necesarios sin saturar tu código.
 */
export function ZenSwagger(config: ZenSwaggerConfig) {
  const decorators = [];

  // Exclude early escape
  if (config.exclude) {
    decorators.push(ApiExcludeEndpoint());
  }

  // Operación principal
  decorators.push(
    ApiOperation({
      summary: config.summary,
      description: config.description,
      deprecated: config.deprecated,
    }),
  );

  // Seguridad
  if (config.isBearerAuth) {
    decorators.push(ApiBearerAuth());
  }

  // Content Types / Uploads
  if (config.consumes && config.consumes.length > 0) {
    decorators.push(ApiConsumes(...config.consumes));
  }

  // Configuración de la Repuesta
  if (config.response) {
    decorators.push(
      ApiResponse({
        status: config.status || 200,
        description: config.summary,
        type: config.response,
      }),
    );
  } else if (config.example) {
    decorators.push(
      ApiResponse({
        status: config.status || 200,
        description: config.summary,
        content: {
          'application/json': {
            example: config.example,
          },
        },
      }),
    );
  } else {
    decorators.push(
      ApiResponse({
        status: config.status || 200,
        description: config.summary,
      }),
    );
  }

  // Configuración del Payload/Body
  if (config.body) {
    decorators.push(ApiBody({ type: config.body }));
  }

  // Configuración opcional para tablas/datos paginados
  if (config.isPaginated) {
    decorators.push(
      ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
      ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
    );
  }

  // Argumentos dinámicos en URL (Parameters)
  if (config.params && config.params.length > 0) {
    config.params.forEach((param) => decorators.push(ApiParam(param)));
  }

  // Argumentos dinámicos de consulta (Queries)
  if (config.queries && config.queries.length > 0) {
    config.queries.forEach((query) => decorators.push(ApiQuery(query)));
  }

  return applyDecorators(...decorators);
}
