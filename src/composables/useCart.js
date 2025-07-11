import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { useOrdersStore } from '@/stores/orders';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';

export function useCart() {
    const cartStore = useCartStore();
    const ordersStore = useOrdersStore();
    const authStore = useAuthStore();
    const toast = useToast();
    const router = useRouter();

    const addToCart = async (product) => {
        try {
            const success = cartStore.addToCart(product);

            if (success) {
                toast.add({
                    severity: 'success',
                    summary: 'Producto agregado',
                    detail: `${product.name} agregado al carrito`,
                    life: 3000
                });
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: cartStore.error,
                    life: 5000
                });
            }
            return success;
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo agregar el producto al carrito',
                life: 5000
            });
            return false;
        }
    };

    const proceedToCheckout = async () => {
        try {
            if (!authStore.isAuthenticated || authStore.userType !== 'client') {
                localStorage.setItem('pendingCart', JSON.stringify(cartStore.items));

                toast.add({
                    severity: 'info',
                    summary: 'Inicia sesión',
                    detail: 'Debes iniciar sesión para continuar con la compra',
                    life: 5000
                });

                router.push('/auth/login');
                return false;
            }

            const isValid = await cartStore.validateCart();
            if (!isValid) {
                toast.add({
                    severity: 'error',
                    summary: 'Error en carrito',
                    detail: cartStore.error,
                    life: 5000
                });
                return false;
            }

            if (cartStore.isCartEmpty) {
                toast.add({
                    severity: 'warn',
                    summary: 'Carrito vacío',
                    detail: 'Agrega productos al carrito antes de proceder al checkout',
                    life: 5000
                });
                return false;
            }

            const success = cartStore.prepareForCheckout();
            if (success) {
                toast.add({
                    severity: 'info',
                    summary: 'Procediendo al checkout',
                    detail: 'Completa tu orden seleccionando la dirección de entrega',
                    life: 4000
                });

                router.push('/orders');
                return true;
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Error en checkout',
                    detail: cartStore.error || 'No se pudo preparar los datos para checkout',
                    life: 5000
                });
                return false;
            }
        } catch (error) {
            console.error('Error in proceedToCheckout:', error);
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'No se pudo proceder al checkout',
                life: 5000
            });
            return false;
        }
    };

    const createOrderFromCart = async (deliveryAddressId, observations = null) => {
        try {
            if (cartStore.isCartEmpty) {
                throw new Error('El carrito está vacío');
            }

            const orderData = {
                delivery_address_id: deliveryAddressId,
                products: cartStore.items.map((item) => ({
                    product_id: item.id,
                    quantity: item.quantity
                })),
                observations: observations || null
            };

            const result = await ordersStore.createOrder(orderData);

            if (result.success) {
                cartStore.clearCart();

                toast.add({
                    severity: 'success',
                    summary: 'Orden creada',
                    detail: 'Tu orden ha sido creada exitosamente',
                    life: 5000
                });

                return {
                    success: true,
                    order: ordersStore.currentOrder,
                    orderId: ordersStore.currentOrder?.id
                };
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Error al crear orden',
                    detail: result.message,
                    life: 5000
                });

                return {
                    success: false,
                    message: result.message
                };
            }
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'No se pudo crear la orden',
                life: 5000
            });

            return {
                success: false,
                message: error.message
            };
        }
    };

    const generatePaymentForOrder = async (orderId) => {
        try {
            const result = await ordersStore.generatePaymentLink(orderId);

            if (result.success) {
                toast.add({
                    severity: 'success',
                    summary: 'Pago generado',
                    detail: 'Redirigiendo a la plataforma de pago...',
                    life: 3000
                });

                const paymentUrl = result.data.init_point;
                if (paymentUrl) {
                    window.location.href = paymentUrl;
                }

                return {
                    success: true,
                    paymentUrl: paymentUrl,
                    preferenceId: result.data.preference_id
                };
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Error al generar pago',
                    detail: result.message,
                    life: 5000
                });

                return {
                    success: false,
                    message: result.message
                };
            }
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'No se pudo generar el pago',
                life: 5000
            });

            return {
                success: false,
                message: error.message
            };
        }
    };

    const createOrderAndPay = async (deliveryAddressId, observations = null) => {
        try {
            const orderResult = await createOrderFromCart(deliveryAddressId, observations);

            if (!orderResult.success) {
                return orderResult;
            }

            const paymentResult = await generatePaymentForOrder(orderResult.orderId);

            return {
                success: paymentResult.success,
                order: orderResult.order,
                orderId: orderResult.orderId,
                paymentUrl: paymentResult.paymentUrl,
                message: paymentResult.message
            };
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Error en el proceso de compra',
                life: 5000
            });

            return {
                success: false,
                message: error.message
            };
        }
    };

    const restorePendingCart = () => {
        try {
            const pendingCart = localStorage.getItem('pendingCart');
            if (pendingCart) {
                const items = JSON.parse(pendingCart);

                items.forEach((item) => {
                    cartStore.addToCart({
                        id: item.id,
                        name: item.name,
                        code: item.code,
                        brand: item.brand,
                        stock: {
                            sale_price: item.price,
                            regular_price: item.original_price,
                            quantity: item.stock_available
                        },
                        image: item.image
                    });
                });

                localStorage.removeItem('pendingCart');

                toast.add({
                    severity: 'success',
                    summary: 'Carrito restaurado',
                    detail: 'Tu carrito ha sido restaurado',
                    life: 3000
                });
            }
        } catch (error) {
            console.error('Error restoring pending cart:', error);
        }
    };

    return {
        cartStore,
        addToCart,
        proceedToCheckout,
        createOrderFromCart,
        generatePaymentForOrder,
        createOrderAndPay,
        restorePendingCart,
        cartItems: cartStore.cartItems,
        totalItems: cartStore.totalItems,
        totalPrice: cartStore.totalPrice,
        totalSavings: cartStore.totalSavings,
        isCartEmpty: cartStore.isCartEmpty,
        cartLoading: cartStore.loading,
        cartError: cartStore.error
    };
}
