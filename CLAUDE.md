# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint with auto-fix

## Project Architecture

This is a Vue 3 application for Master Color Store, a printing equipment store management system. The application follows a modular architecture with clear separation of concerns:

### Core Technology Stack
- **Vue 3** with Composition API
- **Vite** for fast development and building
- **PrimeVue 4** for UI components with Aura theme
- **Tailwind CSS** with PrimeUI integration for styling
- **Pinia** for state management
- **Vue Router** for navigation
- **Axios** for API communication

### Key Architecture Patterns

#### Dual Authentication System
The application supports two distinct user types:
- **Users** (`/auth/*` endpoints) - Employees/administrators with role-based access
- **Clients** (`/client/auth/*` endpoints) - Customers/buyers

The auth system handles:
- Role-based route protection (admin, almacen, client roles)
- Automatic token refresh with 60-second interval checks
- Dual login flows with different endpoints

#### State Management Structure
Pinia stores are organized by domain:
- `auth.js` - Authentication and user session management
- `users.js` - User CRUD operations
- `products.js` - Product management
- `stock.js` - Inventory tracking
- `stockMovements.js` - Stock movement history
- `roles.js` - Role management

#### API Layer
- Unified API interface in `src/api/index.js`
- Axios instance with interceptors in `src/api/axios.js`
- Separate endpoint groups for different user types
- Utility functions for API response handling in `src/utils/apiHelpers.js`

#### Component Architecture
- **Layout System**: `AppLayout.vue` with sidebar navigation and topbar
- **View Components**: Feature-specific pages in `src/views/`
- **Reusable Components**: Shared UI components in `src/components/`
- **Form Components**: Dedicated form components for CRUD operations

### Directory Structure
```
src/
├── api/              # API layer and axios configuration
├── assets/           # Static assets and global styles
├── components/       # Reusable Vue components
├── composables/      # Vue composables for shared logic
├── layout/           # Layout components and layout composables
├── router/           # Vue Router configuration with route guards
├── stores/           # Pinia stores for state management
├── utils/            # Utility functions and helpers
└── views/            # Page components organized by feature
```

### Route Protection
Routes use meta properties for access control:
- `meta: { public: true }` - Public routes (login, register, home)
- `meta: { roles: ['admin'] }` - Role-restricted routes
- Route guards check authentication and role permissions

### Key Features
- **Stock Management**: Complete inventory tracking with movements
- **Product Management**: CRUD operations with image upload support
- **User Management**: Role-based user administration
- **Authentication**: Dual auth system for employees and clients
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Development Notes

### Code Conventions
- Use Composition API for Vue components
- Implement proper error handling with `apiHelpers.js`
- Follow PrimeVue component patterns
- Use Tailwind utility classes for styling
- Maintain consistent file naming (kebab-case for files, PascalCase for components)

### Common Operations
- **Adding new API endpoints**: Update `src/api/index.js` with new functions
- **Creating new stores**: Follow existing store patterns with proper state management
- **Adding protected routes**: Configure route meta and ensure proper role checks
- **Form validation**: Use Vuelidate for consistent form validation
- **Component registration**: Auto-import configured for PrimeVue components

### Testing Commands
Run linting before commits: `npm run lint`