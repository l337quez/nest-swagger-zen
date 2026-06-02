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
  ApiSecurity,
  ApiHeader,
} from '@nestjs/swagger';
import { ApiParamOptions } from '@nestjs/swagger/dist/decorators/api-param.decorator';
import { ApiQueryOptions } from '@nestjs/swagger/dist/decorators/api-query.decorator';
import { ApiHeaderOptions } from '@nestjs/swagger/dist/decorators/api-header.decorator';

/**
 * Tipo auxiliar que representa un mapa de ejemplos nombrados para el body.
 * Cada clave es el nombre del ejemplo visible en la UI de Swagger.
 */
export type ZenBodyExamples = Record<
  string,
  { value: any; summary?: string; description?: string }
>;

/**
 * Interface para definir de forma rápida campos de subida de archivos
 */
export interface ZenFileUpload {
  /** Nombre del campo en el formulario (ej: 'file', 'avatar') */
  name: string;
  /** Si es true, acepta múltiples archivos en ese mismo campo */
  isArray?: boolean;
}

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
  /** Nombre de un esquema de seguridad configurado en tu DocumentBuilder (ej. 'api_key' o 'header_auth') */
  security?: string;
  /** Arreglo para definir cabeceras personalizadas necesarias para la petición (ej. x-api-key, Authorization) */
  headers?: ApiHeaderOptions[];
  /** Arreglo para definir parámetros de ruta explícitos (e.g. /:id) */
  params?: ApiParamOptions[];
  /** Arreglo para definir variables libres que viajen por Query string (?foo=bar) */
  queries?: ApiQueryOptions[];
  /** Tipos de contenido que acepta (ej: ['multipart/form-data'] para archivos) */
  consumes?: string[];
  /** 
   * Facilita la configuración de subida de archivos para Swagger UI.
   * Genera el esquema necesario para mostrar los botones de "Seleccionar archivo".
   * Nota: Esto inyectará 'multipart/form-data' en `consumes` automáticamente.
   */
  fileUploads?: ZenFileUpload | ZenFileUpload[];
  /** Si está en true, oculta completamente el endpoint de la interfaz de Swagger */
  exclude?: boolean;
  /**
   * Mapa de ejemplos nombrados para el body de la petición.
   * Permite mostrar múltiples payloads de ejemplo en el Swagger UI sin tocar el controlador.
   * @example
   * bodyExamples: {
   *   'Ejemplo Básico': { value: { title: 'Landing', settings: { theme: 'light' } } },
   *   'Ejemplo Completo': { value: { title: 'Landing', settings: { theme: 'dark', showSidebar: true } } },
   * }
   */
  bodyExamples?: ZenBodyExamples;
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
  if (config.security) {
    decorators.push(ApiSecurity(config.security));
  }

  // Headers (por ejemplo para Authorization sin bearer, x-api-key, etc.)
  if (config.headers && config.headers.length > 0) {
    config.headers.forEach((header) => decorators.push(ApiHeader(header)));
  }

  // File Uploads (Aseguramos consumes antes de procesarlo)
  if (config.fileUploads) {
    if (!config.consumes) config.consumes = [];
    if (!config.consumes.includes('multipart/form-data')) {
      config.consumes.push('multipart/form-data');
    }
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

  // Configuración del Payload/Body (o File Uploads)
  if (config.fileUploads) {
    const uploads = Array.isArray(config.fileUploads) ? config.fileUploads : [config.fileUploads];
    const properties: Record<string, any> = {};

    uploads.forEach((upload) => {
      if (upload.isArray) {
        properties[upload.name] = {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        };
      } else {
        properties[upload.name] = { type: 'string', format: 'binary' };
      }
    });

    decorators.push(
      ApiBody({
        schema: {
          type: 'object',
          properties,
        },
      }),
    );
  } else if (config.body || config.bodyExamples) {
    decorators.push(
      ApiBody({
        ...(config.body ? { type: config.body } : {}),
        ...(config.bodyExamples ? { examples: config.bodyExamples } : {}),
      }),
    );
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
