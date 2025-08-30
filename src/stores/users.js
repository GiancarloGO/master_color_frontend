import { usersApi } from '@/api/index';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useUsersStore = defineStore('usersStore', {
    state: () => ({
        usersList: cache.getItem('usersList') || [],
        user: cache.getItem('user') || null,
        loading: false,
        error: null,
        success: false,
        message: '',
        validationErrors: []
    }),

    getters: {
        getUsersCount: (state) => state.usersList.length,
        getActiveUsers: (state) => state.usersList.filter((user) => user.status === 'active' || user.status === 1),
        findUserById: (state) => (id) => state.usersList.find((user) => user.id === id)
    },

    actions: {
        async fetchUsers() {
            this.loading = true;
            this.error = null;
            try {
                const response = await usersApi.getUsers();
                const processed = handleProcessSuccess(response, this);
                this.usersList = processed.data.users || processed.data || [];
                cache.setItem('usersList', this.usersList);
                this.success = true;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async getUserById(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await usersApi.getUserById(id);
                const processed = handleProcessSuccess(response, this);
                this.user = processed.data.user || processed.data;
                cache.setItem('user', this.user);
                this.success = true;
                return this.user;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async createUser(payload) {
            this.loading = true;
            this.error = null;
            this.validationErrors = [];
            try {
                const response = await usersApi.createUser(payload);
                const processed = handleProcessSuccess(response, this);
                const newUser = processed.data.user || processed.data;

                // Add the new user to the list
                this.usersList.unshift(newUser);
                this.user = newUser;

                cache.setItem('usersList', this.usersList);
                cache.setItem('user', this.user);
                this.success = true;
                this.message = 'Usuario creado exitosamente';

                return newUser;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async updateUser(id, payload) {
            this.loading = true;
            this.error = null;
            this.validationErrors = [];
            try {
                const response = await usersApi.updateUser(id, payload);
                const processed = handleProcessSuccess(response, this);
                const updatedUser = processed.data.user || processed.data;

                // Update the user in the list
                const index = this.usersList.findIndex((user) => user.id == id);
                if (index !== -1) {
                    this.usersList[index] = updatedUser;
                }

                this.user = updatedUser;

                cache.setItem('usersList', this.usersList);
                cache.setItem('user', this.user);
                this.success = true;
                this.message = 'Usuario actualizado exitosamente';

                return updatedUser;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async deleteUser(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await usersApi.deleteUser(id);
                const processed = handleProcessSuccess(response, this);

                // Remove the user from the list
                this.usersList = this.usersList.filter((user) => user.id != id);

                // Clear current user if it was the deleted one
                if (this.user && this.user.id == id) {
                    this.user = null;
                    cache.removeItem('user');
                }

                cache.setItem('usersList', this.usersList);
                this.success = true;
                this.message = 'Usuario eliminado exitosamente';

                return processed;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async resetUserPassword(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await usersApi.resetPassword(id);
                const processed = handleProcessSuccess(response, this);
                this.success = true;
                this.message = processed.message || 'Contraseña restablecida exitosamente';
                
                return {
                    newPassword: processed.data.new_password,
                    message: this.message
                };
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        }
    }
});
