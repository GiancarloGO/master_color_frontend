class MercadoPagoService {
    constructor() {
        this.mp = null;
        this.initialized = false;
        this.publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
        this.scriptLoaded = false;
    }

    async initialize() {
        if (this.initialized && this.mp) return this.mp;

        try {
            // Validar configuración antes de inicializar
            this.validateConfig();

            // Cargar el script de MercadoPago dinámicamente
            await this.loadMercadoPagoScript();

            // Verificar que la clase MercadoPago esté disponible
            if (typeof window.MercadoPago !== 'function') {
                throw new Error('MercadoPago class not available after script load');
            }

            // Inicializar MercadoPago
            this.mp = new window.MercadoPago(this.publicKey, {
                locale: 'es-PE' // Configurar para Perú
            });
            this.initialized = true;
            return this.mp;
        } catch (error) {
            console.error('Error initializing MercadoPago:', error);
            this.initialized = false;
            this.mp = null;
            throw new Error(`Failed to initialize MercadoPago: ${error.message}`);
        }
    }

    async loadMercadoPagoScript() {
        if (this.scriptLoaded || window.MercadoPago) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            // Verificar si ya existe un script de MercadoPago
            const existingScript = document.querySelector('script[src*="mercadopago"]');
            if (existingScript) {
                this.scriptLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://sdk.mercadopago.com/js/v2';
            script.async = true;
            script.onload = () => {
                this.scriptLoaded = true;
                resolve();
            };
            script.onerror = (error) => {
                console.error('Failed to load MercadoPago script:', error);
                reject(new Error('Failed to load MercadoPago script'));
            };

            // Timeout de 10 segundos
            setTimeout(() => {
                if (!this.scriptLoaded) {
                    reject(new Error('MercadoPago script load timeout'));
                }
            }, 10000);

            document.head.appendChild(script);
        });
    }

    async createCardPaymentBrick(container, options = {}) {
        if (!this.mp) {
            await this.initialize();
        }

        const defaultOptions = {
            locale: 'es-PE',

            // Configuración de inicialización - ESTRUCTURA REQUERIDA POR MP
            initialization: {
                amount: options.initialization?.amount || 0
            },

            // Configuración visual
            appearance: {
                theme: 'default',
                variables: {
                    colorPrimary: '#6366f1',
                    colorSecondary: '#f3f4f6',
                    colorText: '#1f2937',
                    colorBackground: '#ffffff',
                    borderRadius: '8px',
                    formBackgroundColor: '#ffffff',
                    inputBackgroundColor: '#f9fafb',
                    inputFocusBackgroundColor: '#ffffff'
                }
            },

            // Configuración de callbacks
            callbacks: {
                onReady: () => {
                },
                onSubmit: async (cardFormData) => {
                    try {
                        return options.callbacks?.onSubmit ? await options.callbacks.onSubmit(cardFormData) : null;
                    } catch (error) {
                        console.error('Error in onSubmit:', error);
                        throw error;
                    }
                },
                onError: (error) => {
                    console.error('Payment Brick error:', error);
                    if (options.callbacks?.onError) {
                        options.callbacks.onError(error);
                    }
                }
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            initialization: {
                ...defaultOptions.initialization,
                ...options.initialization
            },
            callbacks: {
                ...defaultOptions.callbacks,
                ...options.callbacks
            }
        };


        try {
            const bricksBuilder = this.mp.bricks();
            const cardPaymentBrick = await bricksBuilder.create('payment', container, mergedOptions);
            return cardPaymentBrick;
        } catch (error) {
            console.error('Error creating payment brick:', error);
            throw error;
        }
    }

    async createWalletBrick(container, options = {}) {
        if (!this.mp) {
            await this.initialize();
        }

        const defaultOptions = {
            locale: 'es-PE',
            appearance: {
                theme: 'default',
                variables: {
                    colorPrimary: '#6366f1',
                    borderRadius: '8px'
                }
            },
            callbacks: {
                onReady: () => {
                },
                onSubmit: async (walletFormData) => {
                    try {
                        return options.onSubmit ? await options.onSubmit(walletFormData) : null;
                    } catch (error) {
                        console.error('Error in wallet onSubmit:', error);
                        throw error;
                    }
                },
                onError: (error) => {
                    console.error('Wallet Brick error:', error);
                    if (options.onError) {
                        options.onError(error);
                    }
                }
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            callbacks: {
                ...defaultOptions.callbacks,
                ...options.callbacks
            }
        };

        try {
            const bricksBuilder = this.mp.bricks();
            const walletBrick = await bricksBuilder.create('wallet', container, mergedOptions);
            return walletBrick;
        } catch (error) {
            console.error('Error creating wallet brick:', error);
            throw error;
        }
    }

    async createStatusScreenBrick(container, options = {}) {
        if (!this.mp) {
            await this.initialize();
        }

        const defaultOptions = {
            locale: 'es-PE',
            appearance: {
                theme: 'default',
                variables: {
                    colorPrimary: '#6366f1',
                    borderRadius: '8px'
                }
            },
            callbacks: {
                onReady: () => {
                },
                onError: (error) => {
                    console.error('Status Screen Brick error:', error);
                    if (options.onError) {
                        options.onError(error);
                    }
                }
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            callbacks: {
                ...defaultOptions.callbacks,
                ...options.callbacks
            }
        };

        try {
            const bricksBuilder = this.mp.bricks();
            const statusScreenBrick = await bricksBuilder.create('statusScreen', container, mergedOptions);
            return statusScreenBrick;
        } catch (error) {
            console.error('Error creating status screen brick:', error);
            throw error;
        }
    }

    // Método para crear un token de tarjeta
    async createCardToken(cardData) {
        if (!this.mp) {
            await this.initialize();
        }

        try {
            const response = await this.mp.createCardToken(cardData);
            return response;
        } catch (error) {
            console.error('Error creating card token:', error);
            throw error;
        }
    }

    // Método para obtener métodos de pago
    async getPaymentMethods() {
        if (!this.mp) {
            await this.initialize();
        }

        try {
            const response = await this.mp.getPaymentMethods();
            return response;
        } catch (error) {
            console.error('Error getting payment methods:', error);
            throw error;
        }
    }

    // Método para obtener información del emisor
    async getIssuers(paymentMethodId) {
        if (!this.mp) {
            await this.initialize();
        }

        try {
            const response = await this.mp.getIssuers({ payment_method_id: paymentMethodId });
            return response;
        } catch (error) {
            console.error('Error getting issuers:', error);
            throw error;
        }
    }

    // Método para obtener cuotas
    async getInstallments(bin, amount) {
        if (!this.mp) {
            await this.initialize();
        }

        try {
            const response = await this.mp.getInstallments({
                bin: bin,
                amount: amount
            });
            return response;
        } catch (error) {
            console.error('Error getting installments:', error);
            throw error;
        }
    }

    // Método para destruir un brick
    async destroyBrick(brickInstance) {
        if (brickInstance && typeof brickInstance.unmount === 'function') {
            try {
                await brickInstance.unmount();
            } catch (error) {
                console.error('Error destroying brick:', error);
            }
        }
    }

    // Método para validar configuración
    validateConfig() {
        if (!this.publicKey) {
            throw new Error('MercadoPago public key is required. Please set VITE_MERCADOPAGO_PUBLIC_KEY in your environment variables.');
        }

        // Validar formato de la clave pública
        if (!this.publicKey.startsWith('TEST-') && !this.publicKey.startsWith('APP_USR-')) {
            throw new Error('Invalid MercadoPago public key format. Must start with TEST- or APP_USR-');
        }

        return true;
    }
}

// Exportar instancia singleton
export const mercadoPagoService = new MercadoPagoService();
export default mercadoPagoService;
