import cache from '@/utils/cache';
import { defineStore } from 'pinia';
import { rolesApi } from '@/api/index';
import { handleProcessSuccess, handleProcessError } from '@/utils/apiHelpers';

export const useRolesStore = defineStore('rolesStore', {
    state: () => ({
        rolesList: cache.getItem('rolesList') || [],
        role: cache.getItem('role') || null,
        loading: false,
        error: null,
        success: false,
        message: '',
        validationErrors: []
    }),
    getters: {
        getRolesCount: (state) => state.rolesList.length,
        getActiveRoles: (state) => state.rolesList.filter((role) => role.is_active !== false),
        findRoleById: (state) => (id) => state.rolesList.find((role) => role.id === id),
        findRoleByName: (state) => (name) => state.rolesList.find((role) => role.name?.toLowerCase() === name?.toLowerCase()),
        // Getter para obtener opciones de roles para formularios
        getRoleOptions: (state) =>
            state.rolesList.map((role) => ({
                label: role.name,
                value: role.name,
                id: role.id,
                description: role.description
            }))
    },
    actions: {
        async fetchRoles() {
            this.loading = true;
            this.error = null;
            try {
                const response = await rolesApi.getRoles();
                const processed = handleProcessSuccess(response, this);
                this.rolesList = processed.data.roles || processed.data || [];
                cache.setItem('rolesList', this.rolesList);
                this.success = true;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
            } finally {
                this.loading = false;
            }
        },

        // Método para obtener el severity de un rol basado en su nombre
        getRoleSeverity(roleName) {
            switch (roleName?.toLowerCase()) {
                case 'admin':
                case 'administrador':
                    return 'danger';
                case 'moderator':
                case 'moderador':
                    return 'warning';
                case 'editor':
                    return 'info';
                case 'usuario':
                case 'user':
                default:
                    return 'success';
            }
        }
    }
});
