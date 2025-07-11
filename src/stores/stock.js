import { productsApi } from '@/api/index';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useStockStore = defineStore('stockStore', {
    state: () => ({
        stockList: cache.getItem('stockList') || [],
        loading: false,
        error: null,
        success: false,
        message: '',
        validationErrors: []
    }),

    getters: {
        getStockCount: (state) => state.stockList.length,
        getLowStockProducts: (state) => state.stockList.filter((product) => product.stock_quantity > 0 && product.stock_quantity <= product.min_stock),
        getOutOfStockProducts: (state) => state.stockList.filter((product) => product.stock_quantity === 0),
        getTotalStockValue: (state) =>
            state.stockList.reduce((total, product) => {
                const value = (product.stock_quantity || 0) * (parseFloat(product.purchase_price) || 0);
                return total + value;
            }, 0),
        findProductStockById: (state) => (id) => state.stockList.find((product) => product.id === id)
    },

    actions: {
        async fetchStock() {
            this.loading = true;
            this.error = null;
            try {
                // Use the public endpoint that includes stock information
                const response = await productsApi.getPublicProducts();
                const processed = handleProcessSuccess(response, this);
                this.stockList = processed.data || [];
                cache.setItem('stockList', this.stockList);
                this.success = true;
                console.log('Stock data loaded:', this.stockList);
            } catch (error) {
                this.error = error;
                handleProcessError(error, this);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async refreshStock() {
            await this.fetchStock();
        },

        // Update local stock after a stock movement
        updateProductStock(productId, newQuantity) {
            const productIndex = this.stockList.findIndex((product) => product.id === productId);
            if (productIndex !== -1) {
                this.stockList[productIndex].stock_quantity = newQuantity;
                cache.setItem('stockList', this.stockList);
            }
        },

        // Clear stock data
        clearStockData() {
            this.stockList = [];
            cache.removeItem('stockList');
        }
    }
});
