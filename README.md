# Nest Swagger Zen 🐼

![Nest Swagger Zen Portada](https://github.com/l337quez/nest-swagger-zen/raw/main/assets/nest-swagger-zen.png)

Una librería genérica y estilizada para **NestJS** que te ayudará a limpiar tus controladores y modularizar la documentación de tu API de forma elegante. Con `nest-swagger-zen`, ya no tendrás que definir archivos pesados de configuración llenos de esquemas JSON.

## Características ✨
- **100% Nest-Ready**: Utiliza las convenciones nativas de `@nestjs/swagger` y `applyDecorators`.
- **Limpieza visual**: Configura `ApiOperation`, `ApiResponse`, `ApiBody` y parámetros paginados en un **solo** bloque de configuración limpio y fuertemente tipado.
- **Adiós JSON schemas manuales**: Al usar DTOs, NestJS se encarga de autogenerar los JSON.

## Instalación 📦

Al no estar en el registro público todavía, puedes instalar la librería en tus proyectos Nest referenciando rutas relativas o absolutas:

```bash
npm install nest-swagger-zen
```


## Uso 🚀

### 1. Reemplaza tus JSON manuales con Clases de Datos (DTOs o Modelos)
En lugar de crear constantes masivas que exportan `schema: { type: 'object' ... }`, utiliza clases junto con los decoradores centralizados de esta librería. 

> *Nota: Swagger es agnóstico a la arquitectura. Puedes usar `@ZenProperty()` tanto en tus **DTOs** como directamente en los **Modelos o Entidades** de tu base de datos (Mongoose, TypeORM, etc).*

Crea tus clases para Request (**Body**) o para la respuesta (**Response**) usando `@ZenProperty()`:

```typescript
// dto/user.dto.ts
import { ZenProperty, ZenPropertyOptional } from 'nest-swagger-zen';

export class CreateUserDto {
  @ZenProperty({ example: 'juan@cliente.com', description: 'Correo electrónico' })
  email: string;

  @ZenProperty({ example: 'Juan Pérez' })
  name: string;

  @ZenPropertyOptional({ description: 'Edad del usuario', example: 28 })
  age?: number;
}

export class UserResponseDto {
  @ZenProperty({ example: 'User registered successfully' })
  message: string;
}
```

### 2. Extrae la Configuración a un archivo externo (Patrón Zen)
La idea de esta librería es que tu controlador quede **100% libre de configuraciones**. Crea un archivo de definiciones (por ejemplo `swagger/user.swagger.ts`) donde guardarás toda la metadata, generando decoradores pre-configurados:

```typescript
// swagger/user.swagger.ts
import { ZenSwagger } from 'nest-swagger-zen';
import { CreateUserDto, UserResponseDto } from '../dto/user.dto';

// Creas una constante que ya contiene el decorador listo
export const CreateUserDocs = () => ZenSwagger({
  summary: 'Create User',
  description: 'Endpoint to create a new user in the system.',
  status: 201, 
  body: CreateUserDto, 
  response: UserResponseDto 
});
```

### 3. Aplica tus nuevos decoradores al Controlador
Ahora, importa este decorador en tu controller. Fíjate cómo la lógica de tu endpoint queda absolutamente inmaculada:

```typescript
// user.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { CreateUserDocs } from './swagger/user.swagger'; 
import { CreateUserDto } from './dto/user.dto';

@Controller('users')
export class UserController {

  @Post()
  @CreateUserDocs() 
  create(@Body() payload: CreateUserDto) {
    return { message: "User registered successfully" };
  }
}
```

## Configuración ⚙️

La interfaz `ZenSwaggerConfig` que puedes enviarle a `@ZenSwagger()` soporta abarcar toda la casuística de tu API de manera sencilla:

- `summary` *(string, requerido)*: Título breve del endpoint.
- `description` *(string, opcional)*: Descripción extendida.
- `deprecated` *(boolean, opcional)*: Si se envía `true`, el endpoint aparecerá tachado en Swagger indicando que obsoleto.
- `status` *(number, opcional)*: Código HTTP retornado al tener éxito (Default `200`).
- `body` *(Type, opcional)*: Clase DTO para construir el modelo Swagger JSON del `body`.
- `bodyExamples` *(ZenBodyExamples, opcional)*: Mapa de ejemplos nombrados para el body. Ideal para cuando el body es flexible (`any`) y quieres mostrar varios payloads de ejemplo sin tocar el controlador. Puede combinarse con `body`.
- `response` *(Type, opcional)*: Clase DTO para construir el modelo Swagger JSON de la respuesta.
- `example` *(any, opcional)*: Valor puro a renderizar como respuesta de ejemplo (para respuestas primitivas).
- `isPaginated` *(boolean, opcional)*: Si se envía `true`, agrega automáticamente los parámetros `page` y `limit`.
- `isBearerAuth` *(boolean, opcional)*: Si se envía `true`, añade el requerimiento del token JWT (`@ApiBearerAuth`).
- `security` *(string, opcional)*: Nombre de tu esquema de seguridad configurado en el `DocumentBuilder` (ej. `'api_key'`).
- `headers` *(array, opcional)*: Agrega cabeceras personalizadas requeridas para el endpoint (ej. `[{ name: 'x-api-key' }]`).
- `params` *(array, opcional)*: Arreglo de objetos para documentar variables en la URL. Ej: `[{ name: 'id', description: 'ID de usuario' }]`.
- `queries` *(array, opcional)*: Arreglo para mapear QueryStrings libres. Ej: `[{ name: 'search', required: false }]`.
- `consumes` *(array de strings, opt)*: Útil para forzar format nativos. Ej: `['application/x-www-form-urlencoded']`.
- `fileUploads` *(objeto o array, opcional)*: Genera el esquema binario para subida de archivos (crea el botón "Seleccionar archivo") y auto-inyecta `multipart/form-data`.
- `exclude` *(boolean, opcional)*: Oculta el endpoint del UI de Swagger.

## Subida de Archivos (File Uploads) 📁

Puedes usar la opción `fileUploads` para autogenerar inputs de tipo binario sin ensuciar tus DTOs:

```typescript
// Subir un único archivo
export const UploadAvatarDocs = () => ZenSwagger({
  summary: 'Subir un Avatar',
  fileUploads: { name: 'avatar' } 
});

// Subir múltiples archivos en distintos campos
export const UploadDocs = () => ZenSwagger({
  summary: 'Subir Documentación',
  fileUploads: [
    { name: 'dni_front' },
    { name: 'dni_back' }
  ]
});

// Array de archivos en el mismo campo
export const UploadGalleryDocs = () => ZenSwagger({
  summary: 'Subir Galería',
  fileUploads: { name: 'gallery', isArray: true }
});
```

## Ejemplos de Body Nombrados (`bodyExamples`) 📦

Cuando el payload de un endpoint es dinámico o quieres mostrar distintos escenarios en el Swagger UI, usa `bodyExamples` junto con el tipo auxiliar `ZenBodyExamples`:

```typescript
// swagger/pages.swagger.ts
import { ZenSwagger, ZenBodyExamples } from 'nest-swagger-zen';

const createPageExamples: ZenBodyExamples = {
  'Ejemplo Básico': {
    value: {
      title: 'Landing',
      settings: { theme: 'light' }
    }
  },
  'Ejemplo Completo': {
    value: {
      title: 'Landing',
      settings: { theme: 'dark', showSidebar: true, retargeting: true }
    }
  }
};

export const CreatePageDocs = () => ZenSwagger({
  summary: 'Create Page',
  status: 201,
  bodyExamples: createPageExamples,
});
```

```typescript
// pages.controller.ts
import { CreatePageDocs } from './swagger/pages.swagger';

@Post()
@CreatePageDocs()
create(@Body() body: any) {
  // Controlador 100% limpio ✨
}
```

> 💡 También puedes combinar `body` (para el schema/DTO) con `bodyExamples` al mismo tiempo.