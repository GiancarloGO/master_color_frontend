// vite.config.mjs
import { fileURLToPath, URL } from 'node:url';
import { PrimeVueResolver } from 'file:///C:/Users/Daniel/Desktop/DesarrolloWeb/master_color_frontend/node_modules/@primevue/auto-import-resolver/index.mjs';
import vue from 'file:///C:/Users/Daniel/Desktop/DesarrolloWeb/master_color_frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs';
import Components from 'file:///C:/Users/Daniel/Desktop/DesarrolloWeb/master_color_frontend/node_modules/unplugin-vue-components/dist/vite.js';
import { defineConfig } from 'file:///C:/Users/Daniel/Desktop/DesarrolloWeb/master_color_frontend/node_modules/vite/dist/node/index.js';
var __vite_injected_original_import_meta_url = 'file:///C:/Users/Daniel/Desktop/DesarrolloWeb/master_color_frontend/vite.config.mjs';
var vite_config_default = defineConfig({
    optimizeDeps: {
        noDiscovery: true
    },
    plugins: [
        vue(),
        Components({
            resolvers: [PrimeVueResolver()]
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', __vite_injected_original_import_meta_url))
        }
    }
});
export { vite_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcRGFuaWVsXFxcXERlc2t0b3BcXFxcRGVzYXJyb2xsb1dlYlxcXFxtYXN0ZXJfY29sb3JfZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXERhbmllbFxcXFxEZXNrdG9wXFxcXERlc2Fycm9sbG9XZWJcXFxcbWFzdGVyX2NvbG9yX2Zyb250ZW5kXFxcXHZpdGUuY29uZmlnLm1qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvRGFuaWVsL0Rlc2t0b3AvRGVzYXJyb2xsb1dlYi9tYXN0ZXJfY29sb3JfZnJvbnRlbmQvdml0ZS5jb25maWcubWpzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnO1xuXG5pbXBvcnQgeyBQcmltZVZ1ZVJlc29sdmVyIH0gZnJvbSAnQHByaW1ldnVlL2F1dG8taW1wb3J0LXJlc29sdmVyJztcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcbmltcG9ydCBDb21wb25lbnRzIGZyb20gJ3VucGx1Z2luLXZ1ZS1jb21wb25lbnRzL3ZpdGUnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgICBub0Rpc2NvdmVyeTogdHJ1ZVxuICAgIH0sXG4gICAgcGx1Z2luczogW1xuICAgICAgICB2dWUoKSxcbiAgICAgICAgQ29tcG9uZW50cyh7XG4gICAgICAgICAgICByZXNvbHZlcnM6IFtQcmltZVZ1ZVJlc29sdmVyKCldXG4gICAgICAgIH0pXG4gICAgXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICAgIGFsaWFzOiB7XG4gICAgICAgICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKVxuICAgICAgICB9XG4gICAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWlYLFNBQVMsZUFBZSxXQUFXO0FBRXBaLFNBQVMsd0JBQXdCO0FBQ2pDLE9BQU8sU0FBUztBQUNoQixPQUFPLGdCQUFnQjtBQUN2QixTQUFTLG9CQUFvQjtBQUw2TSxJQUFNLDJDQUEyQztBQVEzUixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUN4QixjQUFjO0FBQUEsSUFDVixhQUFhO0FBQUEsRUFDakI7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNMLElBQUk7QUFBQSxJQUNKLFdBQVc7QUFBQSxNQUNQLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQztBQUFBLElBQ2xDLENBQUM7QUFBQSxFQUNMO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDTCxPQUFPO0FBQUEsTUFDSCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLElBQ3hEO0FBQUEsRUFDSjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
