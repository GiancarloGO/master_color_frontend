import { productsApi } from '@/api/index';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useProductsStore = defineStore('productsStore', {
    state: () => ({
        productsList: cache.getItem('productsList') || [],
        product: cache.getItem('product') || null,
        loading: false,
        error: null,
        success: false,
        message: '',
        validationErrors: []
    }),

    getters: {
        getProductsCount: (state) => state.productsList.length,
        getActiveProducts: (state) => state.productsList.filter((product) => product.status === 'active' || product.status === 1),
        findProductById: (state) => (id) => state.productsList.find((product) => product.id === id)
    },

    actions: {
        async fetchProducts() {
            this.loading = true;
            this.error = null;
            try {
                const response = await productsApi.getProducts();
                const processed = handleProcessSuccess(response, this);
                this.productsList = processed.data.products || processed.data || [];
                cache.setItem('productsList', this.productsList);
                this.success = true;
                console.log(this.productsList);
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async getProductById(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await productsApi.getProductById(id);
                const processed = handleProcessSuccess(response, this);
                this.product = processed.data.product || processed.data;
                cache.setItem('product', this.product);
                this.success = true;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async createProduct(payload) {
            this.loading = true;
            this.error = null;
            this.validationErrors = [];
            try {
                const response = await productsApi.createProduct(payload);
                const processed = handleProcessSuccess(response, this);
                this.product = processed.data.product || processed.data;

                const newProduct = processed.data.product || processed.data;

                this.productsList.unshift(newProduct);
                this.product = newProduct;
                cache.setItem('product', this.product);
                cache.setItem('productsList', this.productsList);
                this.success = true;
                this.message = 'Producto creado exitosamente';
                return this.product;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async updateProduct(id, payload) {
            this.loading = true;
            this.error = null;
            try {
                //payload.append('_method', 'PUT');
                const response = await productsApi.updateProduct(id, payload);
                const processed = handleProcessSuccess(response, this);
                this.product = processed.data.product || processed.data;
                const updatedProduct = processed.data.product || processed.data;

                // Actualizar el producto en la lista
                const index = this.productsList.findIndex((product) => product.id === id);
                if (index !== -1) {
                    this.productsList[index] = updatedProduct;
                }

                cache.setItem('product', this.product);
                cache.setItem('productsList', this.productsList);
                this.success = true;
                this.message = 'Producto actualizado exitosamente';
                return this.product;
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async deleteProduct(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await productsApi.deleteProduct(id);
                const processed = handleProcessSuccess(response, this);

                // Eliminar el producto de la lista
                this.productsList = this.productsList.filter((product) => product.id !== id);

                // Limpiar el producto seleccionado si es el mismo que se eliminó
                if (this.product && this.product.id === id) {
                    this.product = null;
                    cache.removeItem('product');
                }

                cache.setItem('productsList', this.productsList);
                this.success = true;
                this.message = 'Producto eliminado exitosamente';
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
