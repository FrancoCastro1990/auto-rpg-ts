# Clean Architecture Structure

Este proyecto sigue los principios de **Clean Architecture** propuestos por Robert C. Martin (Uncle Bob). La arquitectura está organizada en capas concéntricas donde las dependencias fluyen hacia adentro.

## 🏗️ Capas de la Arquitectura

### 1. 📋 **Entities** (`src/entities/`)
- **Propósito**: Reglas de negocio puras, entidades de dominio
- **Dependencias**: Ninguna (capa más interna)
- **Contenido**:
  - Interfaces de dominio (`interfaces.ts`)
  - Value objects (Stats, Experience, etc.)
  - Entidades principales (Player, Party, Dungeon, etc.)

### 2. 🎯 **Use Cases** (`src/use-cases/`)
- **Propósito**: Lógica de aplicación, casos de uso
- **Dependencias**: Entities
- **Contenido**:
  - Interfaces de casos de uso
  - Implementaciones de lógica de negocio
  - Validaciones de dominio

### 3. 🌐 **Controllers** (`src/controllers/`)
- **Propósito**: Capa de presentación, controladores HTTP
- **Dependencias**: Use Cases
- **Contenido**:
  - Controladores REST API
  - Middlewares de validación
  - Mapeo de requests/responses

### 4. 💾 **Repositories** (`src/repositories/`)
- **Propósito**: Abstracción de acceso a datos
- **Dependencias**: Entities
- **Contenido**:
  - Interfaces de repositorio
  - Implementaciones concretas (MongoDB, etc.)
  - Patrones de consulta

### 5. 🔧 **Infrastructure** (`src/infrastructure/`)
- **Propósito**: Detalles de implementación externos
- **Dependencias**: Todas las capas internas
- **Contenido**:
  - Conexión a base de datos
  - Configuración de servidor
  - Middlewares externos
  - Contenedor de dependencias

## 🔄 Flujo de Dependencias

```
┌─────────────────────────────────────┐
│         🖥️  Controllers            │ ←───┐
│  (Presentación - HTTP)             │    │
└─────────────────────────────────────┘    │
                │                          │
                ▼                          │
┌─────────────────────────────────────┐    │
│         🎯  Use Cases              │    │
│  (Lógica de Negocio)               │    │
└─────────────────────────────────────┘    │
                │                          │
                ▼                          │
┌─────────────────────────────────────┐    │
│         📋  Entities               │    │
│  (Reglas de Dominio)               │    │
└─────────────────────────────────────┘    │
                ▲                          │
                │                          │
┌─────────────────────────────────────┐    │
│         💾  Repositories           │ ───┘
│  (Acceso a Datos)                 │
└─────────────────────────────────────┘
                ▲
                │
┌─────────────────────────────────────┐
│         🔧  Infrastructure         │
│  (Detalles Externos)               │
└─────────────────────────────────────┘
```

## 📁 Estructura de Carpetas

```
src/
├── entities/              # 📋 Reglas de negocio puras
│   ├── interfaces.ts     # Interfaces de dominio
│   └── index.ts          # Exportaciones
├── use-cases/            # 🎯 Casos de uso
│   ├── interfaces.ts     # Contratos de casos de uso
│   └── index.ts          # Exportaciones
├── controllers/          # 🌐 Controladores HTTP
│   └── index.ts          # Exportaciones (vacío por ahora)
├── repositories/         # 💾 Repositorios
│   ├── IBaseRepository.ts # Interfaz base
│   ├── interfaces.ts     # Interfaces específicas
│   └── index.ts          # Exportaciones
├── infrastructure/       # 🔧 Infraestructura
│   ├── database.ts       # Conexión MongoDB
│   ├── dependencyContainer.ts # DI Container
│   ├── middleware/       # Middlewares Express
│   └── index.ts          # Exportaciones
└── index.ts              # Exportaciones principales
```

## 🎯 Principios Aplicados

### SOLID Principles
- **S**: Single Responsibility - Cada clase tiene una responsabilidad
- **O**: Open/Closed - Abierto a extensión, cerrado a modificación
- **L**: Liskov Substitution - Subtipos sustituibles por supertipos
- **I**: Interface Segregation - Interfaces específicas y pequeñas
- **D**: Dependency Inversion - Depende de abstracciones, no concretos

### Clean Architecture Principles
- **Independencia de Frameworks**: El núcleo no depende de frameworks externos
- **Testabilidad**: La lógica de negocio es fácilmente testeable
- **Independencia de UI**: La UI puede cambiar sin afectar el negocio
- **Independencia de Base de Datos**: El negocio no conoce la BD
- **Independencia de Agentes Externos**: Fácil cambio de servicios externos

## 🔧 Inyección de Dependencias

Se utiliza un contenedor de dependencias simple para gestionar las dependencias entre capas:

```typescript
// Configuración de dependencias
import { setPlayerRepository } from './infrastructure/dependencyContainer';

// Registro de implementaciones
setPlayerRepository(new MongoPlayerRepository());

// Uso en controladores
const playerRepo = getPlayerRepository();
```

## 📋 Interfaces Principales

### Repositories
```typescript
interface IBaseRepository<T, TId = string> {
  findById(id: TId): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  update(id: TId, entity: Partial<T>): Promise<T | null>;
  delete(id: TId): Promise<boolean>;
  exists(id: TId): Promise<boolean>;
}
```

### Use Cases
```typescript
interface IBaseUseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
```

### Entities
```typescript
interface IPlayer {
  id: string;
  username: string;
  level: number;
  experience: IExperience;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🚀 Beneficios de Esta Arquitectura

- **Mantenibilidad**: Código organizado y fácil de mantener
- **Testabilidad**: Cada capa se puede testear independientemente
- **Flexibilidad**: Fácil cambio de implementaciones (BD, frameworks, etc.)
- **Escalabilidad**: Nuevo código se integra naturalmente
- **Separación de Responsabilidades**: Cada capa tiene un propósito claro

## 📚 Próximos Pasos

1. **Implementar Modelos de Dominio** (R005): Crear clases concretas de entidades
2. **Crear Repositorios Concretos** (R006): Implementar MongoDB repositories
3. **Implementar Casos de Uso** (R007-R009): Lógica de negocio concreta
4. **Crear Controladores** (R012-R014): Endpoints REST API
5. **Configurar Rutas** (R015): Organización de rutas Express

---

*Esta estructura proporciona una base sólida para el desarrollo de la API REST con principios de Clean Architecture.*