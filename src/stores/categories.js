import { categoriesApi } from '@/api/index';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useCategoriesStore = defineStore('categoriesStore', {
    state: () => ({
        categoriesList: cache.getItem('categoriesList') || [],
        category: null,
        loading: false,
        error: null,
        success: false,
        message: '',
        validationErrors: []
    }),

    getters: {
        getCategoriesCount: (state) => state.categoriesList.length,
        getActiveCategories: (state) => state.categoriesList.filter((category) => category.active),
        findCategoryById: (state) => (id) => state.categoriesList.find((category) => category.id === id)
    },

    actions: {
        async fetchCategories() {
            this.loading = true;
            this.error = null;
            try {
                const response = await categoriesApi.getCategories();
                const processed = handleProcessSuccess(response, this);
                this.categoriesList = processed.data || [];
                cache.setItem('categoriesList', this.categoriesList);
                this.success = true;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async createCategory(payload) {
            this.loading = true;
            this.error = null;
            this.validationErrors = [];
            try {
                const response = await categoriesApi.createCategory(payload);
                const processed = handleProcessSuccess(response, this);
                const newCategory = processed.data;

                this.categoriesList.unshift(newCategory);
                cache.setItem('categoriesList', this.categoriesList);
                this.success = true;
                this.message = 'Categoría creada exitosamente';
                return newCategory;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async updateCategory(id, payload) {
            this.loading = true;
            this.error = null;
            this.validationErrors = [];
            try {
                const response = await categoriesApi.updateCategory(id, payload);
                const processed = handleProcessSuccess(response, this);
                const updatedCategory = processed.data;

                const index = this.categoriesList.findIndex((category) => category.id === id);
                if (index !== -1) {
                    this.categoriesList[index] = updatedCategory;
                }

                cache.setItem('categoriesList', this.categoriesList);
                this.success = true;
                this.message = 'Categoría actualizada exitosamente';
                return updatedCategory;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async deleteCategory(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await categoriesApi.deleteCategory(id);
                const processed = handleProcessSuccess(response, this);

                this.categoriesList = this.categoriesList.filter((category) => category.id !== id);
                cache.setItem('categoriesList', this.categoriesList);
                this.success = true;
                this.message = 'Categoría eliminada exitosamente';
                return processed;
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
