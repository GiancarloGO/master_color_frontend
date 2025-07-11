# Master Color Store - Frontend

<p align="center">
  <img src="/public/mc.png" alt="Master Color Logo" width="120" />
</p>

## Descripción

Master Color Store es una aplicación web moderna para una tienda especializada en equipos de impresión y fotocopiado. Desarrollada con Vue 3, Vite, PrimeVue y Tailwind CSS, ofrece una experiencia de usuario fluida y atractiva con un diseño responsivo y accesible.

## Características

- **Interfaz moderna y responsiva**: Diseño adaptable a dispositivos móviles y de escritorio
- **Catálogo de productos**: Visualización de impresoras, tintas y accesorios con filtrado por categorías
- **Carrito de compras**: Gestión completa de productos seleccionados
- **Autenticación de usuarios**: Sistema de login y registro con validación de formularios
- **Diseño accesible**: Alto contraste y navegación intuitiva

## Tecnologías

- **Vue 3**: Framework progresivo para construir interfaces de usuario
- **Vite**: Herramienta de compilación rápida para desarrollo moderno
- **PrimeVue**: Biblioteca de componentes UI rica y accesible
- **Tailwind CSS**: Framework de utilidades CSS para diseño rápido y consistente
- **Vue Router**: Enrutamiento oficial para aplicaciones Vue.js

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/DanielMoranV/master_color_frontend.git

# Navegar al directorio del proyecto
cd master_color_frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## Estructura del Proyecto

```
src/
├── assets/          # Recursos estáticos (imágenes, estilos)
├── components/      # Componentes reutilizables
├── layouts/         # Layouts de la aplicación
├── plugins/         # Plugins y configuraciones
├── router/          # Configuración de rutas
├── services/        # Servicios para API y lógica de negocio
├── store/           # Estado global (opcional)
├── utils/           # Utilidades y helpers
├── views/           # Vistas/páginas de la aplicación
│   ├── auth/        # Páginas de autenticación
│   └── store/       # Páginas de la tienda
└── App.vue          # Componente raíz
```

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Compila la aplicación para producción
- `npm run preview`: Vista previa de la compilación de producción
- `npm run lint`: Ejecuta el linter para verificar el código

## Contribución

1. Fork el repositorio
2. Crea una rama para tu característica (`git checkout -b feature/amazing-feature`)
3. Realiza tus cambios
4. Haz commit de tus cambios (`git commit -m 'Añadir nueva característica'`)
5. Push a la rama (`git push origin feature/amazing-feature`)
6. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Master Color - [website@mastercolor.com](mailto:website@mastercolor.com)

Proyecto: [https://github.com/tu-usuario/master-color-frontend](https://github.com/tu-usuario/master-color-frontend)
