<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    order: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible']);

const isVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const currentDate = ref(
    new Date().toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
);

const orderItems = computed(() => {
    if (!props.order) return [];

    console.log('Order data for receipt:', props.order);

    let items = [];

    if (props.order.items && props.order.items.length > 0) {
        items = props.order.items;
    } else if (props.order.products && props.order.products.length > 0) {
        items = props.order.products;
    } else if (props.order.order_details && props.order.order_details.length > 0) {
        items = props.order.order_details.map((detail) => ({
            name: detail.product?.name || detail.name || 'Producto sin nombre',
            sku: detail.product?.sku || detail.sku || '',
            quantity: detail.quantity || 1,
            unit_price: detail.unit_price || detail.price || 0,
            subtotal: detail.subtotal || (detail.unit_price || detail.price || 0) * (detail.quantity || 1)
        }));
    } else {
        // Fallback: usar la función getOrderProducts del store
        const products = props.order.items || props.order.products || props.order.order_details || [];
        items = products.map((product) => ({
            name: product.name || product.product_name || product.product?.name || 'Producto sin nombre',
            sku: product.sku || product.product?.sku || '',
            quantity: product.quantity || product.pivot?.quantity || product.qty || 1,
            unit_price: product.price || product.unit_price || product.product?.price || 0,
            subtotal: (product.price || product.unit_price || 0) * (product.quantity || 1)
        }));
    }

    console.log('Processed items for receipt:', items);
    return items;
});

const deliveryAddress = computed(() => {
    return props.order?.delivery_address || props.order?.address;
});

const orderSubtotal = computed(() => {
    return orderItems.value.reduce((total, item) => {
        return total + (item.subtotal || (item.unit_price || item.price || 0) * (item.quantity || 1));
    }, 0);
});

const shippingCost = computed(() => {
    return props.order?.shipping_cost || (orderSubtotal.value >= 100 ? 0 : 15);
});

const orderTotal = computed(() => {
    return parseFloat(props.order?.total || 0);
});

const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount) || 0;
    return `S/ ${numericAmount.toFixed(2)}`;
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const printReceipt = () => {
    // Crear ventana nueva para impresión sin headers del navegador
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const receiptContent = document.getElementById('receipt-content');

    if (!receiptContent) return;

    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Comprobante de Venta - Master Color</title>
            <style>
                @page {
                    margin: 0.5in;
                    size: A4;
                }
                
                * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    box-sizing: border-box;
                }
                
                body {
                    margin: 0;
                    padding: 15px;
                    font-family: Arial, sans-serif;
                    font-size: 11pt;
                    line-height: 1.3;
                    color: #333;
                    background: white;
                }
                
                .company-header {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 12px;
                    margin-bottom: 12px;
                }
                
                .logo-image {
                    width: 50px;
                    height: 50px;
                    object-fit: contain;
                }
                
                .company-info {
                    text-align: center;
                }
                
                .company-name {
                    font-size: 16pt;
                    font-weight: bold;
                    color: #333;
                    margin: 0 0 3px 0;
                    text-transform: uppercase;
                }
                
                .company-tagline {
                    font-size: 10pt;
                    color: #666;
                    margin: 0 0 8px 0;
                    font-style: italic;
                }
                
                .company-details p {
                    font-size: 9pt;
                    color: #666;
                    margin: 1px 0;
                }
                
                .receipt-header {
                    text-align: center;
                    margin-bottom: 12px;
                }
                
                .receipt-header h2 {
                    font-size: 14pt;
                    font-weight: bold;
                    color: #333;
                    margin: 8px 0;
                    text-transform: uppercase;
                }
                
                .receipt-number {
                    font-size: 12pt;
                    font-weight: bold;
                    color: #333;
                    background: #f0f0f0;
                    padding: 4px 8px;
                    border: 1px solid #333;
                    display: inline-block;
                }
                
                .receipt-dates {
                    margin-top: 8px;
                }
                
                .date-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 2px 0;
                    font-size: 9pt;
                }
                
                .date-label {
                    font-weight: bold;
                    color: #333;
                }
                
                .date-value {
                    color: #666;
                }
                
                .status-value {
                    background: #e8f5e8;
                    color: #2d5a2d;
                    padding: 2px 6px;
                    border: 1px solid #4a7c4a;
                    font-weight: bold;
                    font-size: 8pt;
                }
                
                .delivery-section {
                    margin: 12px 0;
                    padding: 8px;
                    background: #f9f9f9;
                    border: 1px solid #ddd;
                }
                
                .delivery-section h3,
                .products-section h3,
                .observations-section h3 {
                    font-size: 11pt;
                    font-weight: bold;
                    color: #333;
                    margin: 0 0 8px 0;
                    text-transform: uppercase;
                }
                
                .address-line {
                    color: #333;
                    margin: 1px 0;
                    font-size: 9pt;
                }
                
                .products-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 8px 0;
                    border: 1px solid #333;
                }
                
                .products-table th {
                    background: #f0f0f0;
                    color: #333;
                    font-weight: bold;
                    padding: 6px 4px;
                    border: 1px solid #333;
                    text-align: center;
                    font-size: 8pt;
                    text-transform: uppercase;
                }
                
                .products-table td {
                    padding: 4px;
                    border: 1px solid #333;
                    color: #333;
                    font-size: 9pt;
                    vertical-align: top;
                }
                
                .product-name-cell {
                    text-align: left;
                }
                
                .quantity-cell,
                .price-cell,
                .total-cell {
                    text-align: center;
                    font-weight: bold;
                }
                
                .product-title {
                    font-weight: bold;
                    display: block;
                    margin-bottom: 1px;
                }
                
                .product-sku {
                    font-size: 7pt;
                    color: #666;
                }
                
                .totals-section {
                    margin: 12px 0;
                }
                
                .totals-table {
                    width: 250px;
                    margin-left: auto;
                    border: 1px solid #333;
                    padding: 8px;
                    background: #f9f9f9;
                }
                
                .totals-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 2px 0;
                    font-size: 9pt;
                    color: #333;
                }
                
                .totals-row.total {
                    border-top: 2px solid #333;
                    margin-top: 4px;
                    padding-top: 6px;
                    font-size: 11pt;
                    font-weight: bold;
                }
                
                .totals-label {
                    font-weight: bold;
                }
                
                .observations-section {
                    margin: 12px 0;
                    padding: 8px;
                    background: #f9f9f9;
                    border: 1px solid #ddd;
                }
                
                .observations-text {
                    color: #333;
                    font-size: 9pt;
                    margin: 0;
                }
                
                .receipt-footer {
                    border-top: 2px solid #333;
                    padding-top: 12px;
                    margin-top: 12px;
                }
                
                .footer-note {
                    text-align: center;
                    margin-bottom: 8px;
                }
                
                .footer-note p {
                    color: #666;
                    font-size: 9pt;
                    margin: 2px 0;
                }
                
                .footer-note p:first-child {
                    font-weight: bold;
                    color: #333;
                    font-size: 10pt;
                }
                
                .footer-signature {
                    text-align: center;
                    border-top: 1px solid #ddd;
                    padding-top: 8px;
                    margin-top: 8px;
                }
                
                .footer-signature p {
                    color: #999;
                    font-size: 7pt;
                    margin: 1px 0;
                }
            </style>
        </head>
        <body>
            ${receiptContent.innerHTML}
        </body>
        </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };
};

const canPrintReceipt = computed(() => {
    if (!props.order) return false;
    const printableStatuses = ['pendiente', 'confirmado', 'procesando', 'enviado', 'entregado'];
    return printableStatuses.includes(props.order.status);
});

const getStatusLabel = (status) => {
    const statusMap = {
        pendiente: 'Pagado - Preparando Envío',
        confirmado: 'Confirmado',
        procesando: 'En Preparación',
        enviado: 'Enviado',
        entregado: 'Entregado'
    };
    return statusMap[status] || status;
};
</script>

<template>
    <Dialog v-model:visible="isVisible" modal header="Comprobante de Venta" :style="{ width: '90vw', maxWidth: '800px' }" class="sales-receipt-modal">
        <div v-if="order && canPrintReceipt" class="receipt-container">
            <!-- Vista previa del comprobante -->
            <div class="receipt-preview" id="receipt-content">
                <!-- Header de la empresa -->
                <div class="company-header">
                    <div class="company-logo">
                        <img src="/mc.png" alt="Master Color" class="logo-image" />
                    </div>
                    <div class="company-info">
                        <h1 class="company-name">Master Color</h1>
                        <p class="company-tagline">Equipos de Impresión y Suministros</p>
                        <div class="company-details">
                            <p>RUC: 20123456789</p>
                            <p>Dirección: Av. Principal 123, Lima, Perú</p>
                            <p>Teléfono: +51 999 830 565</p>
                            <p>Email: ventas@mastercolor.pe</p>
                        </div>
                    </div>
                </div>

                <!-- Información del comprobante -->
                <div class="receipt-info">
                    <div class="receipt-header">
                        <h2>COMPROBANTE DE VENTA</h2>
                        <div class="receipt-number">N° {{ order.id.toString().padStart(8, '0') }}</div>
                    </div>

                    <div class="receipt-dates">
                        <div class="date-row">
                            <span class="date-label">Fecha de Orden:</span>
                            <span class="date-value">{{ formatDate(order.created_at) }}</span>
                        </div>
                        <div class="date-row">
                            <span class="date-label">Fecha de Impresión:</span>
                            <span class="date-value">{{ currentDate }}</span>
                        </div>
                        <div class="date-row">
                            <span class="date-label">Estado:</span>
                            <span class="date-value status-value">{{ getStatusLabel(order.status) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Dirección de entrega -->
                <div v-if="deliveryAddress" class="delivery-section">
                    <h3>DIRECCIÓN DE ENTREGA</h3>
                    <div class="address-details">
                        <p class="address-line">{{ deliveryAddress.address_full }}</p>
                        <p class="address-line">{{ deliveryAddress.district }}, {{ deliveryAddress.province }}</p>
                        <p class="address-line">{{ deliveryAddress.department }}</p>
                        <p v-if="deliveryAddress.postal_code" class="address-line">CP: {{ deliveryAddress.postal_code }}</p>
                        <p v-if="deliveryAddress.reference" class="address-line">Ref: {{ deliveryAddress.reference }}</p>
                    </div>
                </div>

                <!-- Debug info para desarrollo -->
                <div v-if="orderItems.length === 0" class="debug-section" style="background: #fff3cd; padding: 1rem; margin: 1rem 0; border-radius: 8px">
                    <p><strong>Debug - No se encontraron productos:</strong></p>
                    <p>Order keys: {{ order ? Object.keys(order).join(', ') : 'No order' }}</p>
                    <p>Items: {{ order?.items?.length || 0 }}</p>
                    <p>Products: {{ order?.products?.length || 0 }}</p>
                    <p>Order Details: {{ order?.order_details?.length || 0 }}</p>
                </div>

                <!-- Detalle de productos -->
                <div class="products-section">
                    <h3>DETALLE DE PRODUCTOS</h3>

                    <!-- Mostrar mensaje si no hay productos -->
                    <div v-if="orderItems.length === 0" class="no-products-message">
                        <p>No se encontraron productos para esta orden.</p>
                    </div>

                    <!-- Tabla de productos -->
                    <table v-else class="products-table">
                        <thead>
                            <tr>
                                <th class="product-name-header">Producto</th>
                                <th class="quantity-header">Cant.</th>
                                <th class="price-header">P. Unit.</th>
                                <th class="total-header">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, index) in orderItems" :key="index" class="product-row">
                                <td class="product-name-cell">
                                    <div class="product-info">
                                        <span class="product-title">{{ item.name || 'Producto sin nombre' }}</span>
                                        <span v-if="item.sku" class="product-sku">SKU: {{ item.sku }}</span>
                                    </div>
                                </td>
                                <td class="quantity-cell">{{ item.quantity || 1 }}</td>
                                <td class="price-cell">{{ formatCurrency(item.unit_price || item.price || 0) }}</td>
                                <td class="total-cell">{{ formatCurrency(item.subtotal || (item.unit_price || item.price || 0) * (item.quantity || 1)) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Totales -->
                <div class="totals-section">
                    <div class="totals-table">
                        <div class="totals-row">
                            <span class="totals-label">Subtotal:</span>
                            <span class="totals-value">{{ formatCurrency(orderSubtotal) }}</span>
                        </div>
                        <div class="totals-row">
                            <span class="totals-label">Envío:</span>
                            <span class="totals-value">{{ shippingCost > 0 ? formatCurrency(shippingCost) : 'Gratis' }}</span>
                        </div>
                        <div v-if="order.discount" class="totals-row discount">
                            <span class="totals-label">Descuento:</span>
                            <span class="totals-value">-{{ formatCurrency(order.discount) }}</span>
                        </div>
                        <div class="totals-row total">
                            <span class="totals-label">TOTAL:</span>
                            <span class="totals-value">{{ formatCurrency(orderTotal) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Observaciones -->
                <div v-if="order.observations" class="observations-section">
                    <h3>OBSERVACIONES</h3>
                    <p class="observations-text">{{ order.observations }}</p>
                </div>

                <!-- Footer -->
                <div class="receipt-footer">
                    <div class="footer-note">
                        <p>¡Gracias por su compra!</p>
                        <p>Para consultas sobre su pedido, contáctenos al +51 999 830 565</p>
                        <p>https://master-color-frontend-mu.vercel.app/</p>
                    </div>
                    <div class="footer-signature">
                        <p>Documento generado automáticamente</p>
                        <p>Fecha de impresión: {{ currentDate }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Estado cuando no se puede imprimir -->
        <div v-else-if="order && !canPrintReceipt" class="no-print-state">
            <i class="pi pi-exclamation-triangle warning-icon"></i>
            <h3>No se puede generar comprobante</h3>
            <p>Este comprobante solo está disponible para órdenes con estado:</p>
            <ul class="status-list">
                <li>Pagado - Preparando Envío</li>
                <li>Confirmado</li>
                <li>En Preparación</li>
                <li>Enviado</li>
                <li>Entregado</li>
            </ul>
            <p>
                Estado actual: <strong>{{ getStatusLabel(order.status) }}</strong>
            </p>
        </div>

        <!-- Estado de error -->
        <div v-else class="error-state">
            <i class="pi pi-exclamation-triangle error-icon"></i>
            <p>No se encontró información de la orden</p>
        </div>

        <template #footer>
            <div class="modal-actions">
                <Button label="Cerrar" icon="pi pi-times" class="p-button-outlined" @click="isVisible = false" />
                <Button v-if="canPrintReceipt" label="Imprimir" icon="pi pi-print" class="print-button" @click="printReceipt" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
/* Estilos generales del modal */
.sales-receipt-modal {
    font-family: 'Arial', sans-serif;
}

/* Vista previa del comprobante */
.receipt-container {
    max-height: 70vh;
    overflow-y: auto;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
}

.receipt-preview {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    max-width: 100%;
    margin: 0 auto;
}

/* Header de la empresa */
.company-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 1.5rem;
    margin-bottom: 1.5rem;
}

.company-logo {
    flex-shrink: 0;
}

.logo-image {
    width: 80px;
    height: 80px;
    object-fit: contain;
}

.company-info {
    text-align: center;
}

.company-name {
    font-size: 2rem;
    font-weight: 700;
    color: #10b981;
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 2px;
}

.company-tagline {
    font-size: 1rem;
    color: #64748b;
    margin: 0 0 1rem 0;
    font-style: italic;
}

.company-details {
    font-size: 0.875rem;
    color: #64748b;
    line-height: 1.4;
}

.company-details p {
    margin: 0.25rem 0;
}

/* Información del comprobante */
.receipt-info {
    margin-bottom: 1.5rem;
}

.receipt-header {
    text-align: center;
    margin-bottom: 1rem;
}

.receipt-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #374151;
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.receipt-number {
    font-size: 1.25rem;
    font-weight: 600;
    color: #10b981;
    background: #ecfdf5;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    display: inline-block;
}

.receipt-dates {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
}

.date-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
}

.date-label {
    font-weight: 600;
    color: #374151;
}

.date-value {
    color: #64748b;
}

.status-value {
    background: #ecfdf5;
    color: #10b981;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.875rem;
}

/* Dirección de entrega */
.delivery-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.delivery-section h3 {
    font-size: 1rem;
    font-weight: 700;
    color: #374151;
    margin: 0 0 1rem 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.address-details {
    font-size: 0.875rem;
    color: #64748b;
    line-height: 1.5;
}

.address-line {
    margin: 0.25rem 0;
}

/* Sección de productos */
.products-section {
    margin-bottom: 1.5rem;
}

.products-section h3 {
    font-size: 1rem;
    font-weight: 700;
    color: #374151;
    margin: 0 0 1rem 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.products-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}

.products-table th {
    background: #f8fafc;
    color: #374151;
    font-weight: 600;
    padding: 0.75rem 0.5rem;
    border: 1px solid #e2e8f0;
    text-align: left;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
}

.products-table td {
    padding: 0.75rem 0.5rem;
    border: 1px solid #e2e8f0;
    color: #64748b;
}

.product-name-header {
    width: 50%;
}

.quantity-header,
.price-header,
.total-header {
    width: 16.67%;
    text-align: center;
}

.product-name-cell {
    font-weight: 500;
    color: #374151;
}

.product-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.product-title {
    font-weight: 600;
}

.product-sku {
    font-size: 0.75rem;
    color: #9ca3af;
}

.quantity-cell,
.price-cell,
.total-cell {
    text-align: center;
    font-weight: 500;
}

.total-cell {
    font-weight: 600;
    color: #374151;
}

/* Totales */
.totals-section {
    margin-bottom: 1.5rem;
}

.totals-table {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-left: auto;
    width: 300px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    background: #f8fafc;
}

.totals-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
    font-size: 0.875rem;
}

.totals-row.total {
    border-top: 2px solid #e2e8f0;
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    font-size: 1rem;
    font-weight: 700;
    color: #10b981;
}

.totals-row.discount {
    color: #059669;
}

.totals-label {
    font-weight: 600;
    color: #374151;
}

.totals-value {
    font-weight: 600;
    color: #64748b;
}

.totals-row.total .totals-value {
    color: #10b981;
}

/* Observaciones */
.observations-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f0f9ff;
    border-radius: 8px;
    border: 1px solid #e0f2fe;
}

.observations-section h3 {
    font-size: 1rem;
    font-weight: 700;
    color: #374151;
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.observations-text {
    color: #0c4a6e;
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0;
}

/* Footer */
.receipt-footer {
    border-top: 2px solid #e2e8f0;
    padding-top: 1.5rem;
    margin-top: 1.5rem;
}

.footer-note {
    text-align: center;
    margin-bottom: 1rem;
}

.footer-note p {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0.25rem 0;
}

.footer-note p:first-child {
    font-weight: 600;
    color: #10b981;
    font-size: 1rem;
}

.footer-signature {
    text-align: center;
    border-top: 1px solid #e2e8f0;
    padding-top: 1rem;
}

.footer-signature p {
    color: #9ca3af;
    font-size: 0.75rem;
    margin: 0.125rem 0;
}

/* Estados de error/advertencia */
.no-print-state,
.error-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #64748b;
}

.warning-icon,
.error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.warning-icon {
    color: #f59e0b;
}

.error-icon {
    color: #ef4444;
}

.no-print-state h3,
.error-state h3 {
    color: #374151;
    margin: 0 0 1rem 0;
}

.status-list {
    text-align: left;
    display: inline-block;
    margin: 1rem 0;
}

.status-list li {
    margin: 0.25rem 0;
    color: #64748b;
}

/* Acciones del modal */
.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.print-button {
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    color: white;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    border-radius: 8px;
}

.print-button:hover {
    background: linear-gradient(135deg, #059669, #047857);
}

/* Estilos para impresión */
@media print {
    /* Configuración de página */
    @page {
        margin: 0.5in;
        size: A4;
    }

    /* Resetear estilos del modal */
    * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
    }

    html,
    body {
        margin: 0 !important;
        padding: 0 !important;
        height: auto !important;
        overflow: visible !important;
    }

    body * {
        visibility: hidden !important;
    }

    #receipt-content,
    #receipt-content * {
        visibility: visible !important;
    }

    .receipt-container {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: visible !important;
        max-height: none !important;
    }

    #receipt-content {
        position: relative !important;
        width: 100% !important;
        background: white !important;
        color: black !important;
        font-size: 11pt !important;
        line-height: 1.3 !important;
        margin: 0 !important;
        padding: 15px !important;
        box-shadow: none !important;
        page-break-inside: auto !important;
    }

    .company-header {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 12px !important;
        border-bottom: 2px solid #333 !important;
        padding-bottom: 12px !important;
        margin-bottom: 12px !important;
        page-break-inside: avoid !important;
    }

    .logo-image {
        width: 50px !important;
        height: 50px !important;
        object-fit: contain !important;
    }

    .company-info {
        text-align: center !important;
    }

    .company-name {
        font-size: 16pt !important;
        font-weight: bold !important;
        color: #333 !important;
        margin: 0 0 3px 0 !important;
        text-transform: uppercase !important;
    }

    .company-tagline {
        font-size: 10pt !important;
        color: #666 !important;
        margin: 0 0 8px 0 !important;
        font-style: italic !important;
    }

    .company-details {
        display: block !important;
    }

    .company-details p {
        font-size: 9pt !important;
        color: #666 !important;
        margin: 1px 0 !important;
        line-height: 1.2 !important;
    }

    .receipt-info {
        margin-bottom: 12px !important;
        page-break-inside: avoid !important;
    }

    .receipt-header {
        text-align: center !important;
        margin-bottom: 8px !important;
    }

    .receipt-header h2 {
        font-size: 14pt !important;
        font-weight: bold !important;
        color: #333 !important;
        margin: 8px 0 !important;
        text-transform: uppercase !important;
    }

    .receipt-number {
        font-size: 12pt !important;
        font-weight: bold !important;
        color: #333 !important;
        background: #f0f0f0 !important;
        padding: 4px 8px !important;
        border: 1px solid #333 !important;
        display: inline-block !important;
    }

    .receipt-dates {
        display: block !important;
        margin-top: 8px !important;
    }

    .date-row {
        display: flex !important;
        justify-content: space-between !important;
        padding: 2px 0 !important;
        font-size: 9pt !important;
        margin: 0 !important;
    }

    .date-label {
        font-weight: bold !important;
        color: #333 !important;
    }

    .date-value {
        color: #666 !important;
    }

    .status-value {
        background: #e8f5e8 !important;
        color: #2d5a2d !important;
        padding: 2px 6px !important;
        border: 1px solid #4a7c4a !important;
        font-weight: bold !important;
        font-size: 8pt !important;
    }

    .delivery-section {
        margin: 12px 0 !important;
        padding: 8px !important;
        background: #f9f9f9 !important;
        border: 1px solid #ddd !important;
        page-break-inside: avoid !important;
    }

    .delivery-section h3 {
        font-size: 11pt !important;
        font-weight: bold !important;
        color: #333 !important;
        margin: 0 0 6px 0 !important;
        text-transform: uppercase !important;
    }

    .address-details {
        font-size: 9pt !important;
        line-height: 1.3 !important;
    }

    .address-line {
        color: #333 !important;
        margin: 1px 0 !important;
    }

    .products-section {
        margin: 12px 0 !important;
        page-break-inside: avoid !important;
    }

    .products-section h3 {
        font-size: 11pt !important;
        font-weight: bold !important;
        color: #333 !important;
        margin: 0 0 8px 0 !important;
        text-transform: uppercase !important;
    }

    .products-table {
        width: 100% !important;
        border-collapse: collapse !important;
        font-size: 9pt !important;
        margin: 0 !important;
        border: 1px solid #333 !important;
    }

    .products-table th {
        background: #f0f0f0 !important;
        color: #333 !important;
        font-weight: bold !important;
        padding: 6px 4px !important;
        border: 1px solid #333 !important;
        text-align: center !important;
        font-size: 8pt !important;
        text-transform: uppercase !important;
    }

    .products-table td {
        padding: 4px !important;
        border: 1px solid #333 !important;
        color: #333 !important;
        font-size: 9pt !important;
        vertical-align: top !important;
    }

    .product-name-cell {
        text-align: left !important;
    }

    .quantity-cell,
    .price-cell,
    .total-cell {
        text-align: center !important;
        font-weight: bold !important;
    }

    .product-info {
        display: block !important;
    }

    .product-title {
        font-weight: bold !important;
        color: #333 !important;
        margin: 0 !important;
        line-height: 1.2 !important;
    }

    .product-sku {
        font-size: 7pt !important;
        color: #666 !important;
        margin: 1px 0 0 0 !important;
    }

    .totals-section {
        margin: 12px 0 !important;
        page-break-inside: avoid !important;
    }

    .totals-table {
        width: 250px !important;
        margin-left: auto !important;
        border: 1px solid #333 !important;
        padding: 8px !important;
        background: #f9f9f9 !important;
    }

    .totals-row {
        display: flex !important;
        justify-content: space-between !important;
        padding: 2px 0 !important;
        font-size: 9pt !important;
        color: #333 !important;
        margin: 0 !important;
    }

    .totals-row.total {
        border-top: 2px solid #333 !important;
        margin-top: 4px !important;
        padding-top: 6px !important;
        font-size: 11pt !important;
        font-weight: bold !important;
    }

    .totals-label {
        font-weight: bold !important;
        color: #333 !important;
    }

    .totals-value {
        color: #333 !important;
    }

    .observations-section {
        margin: 12px 0 !important;
        padding: 8px !important;
        background: #f9f9f9 !important;
        border: 1px solid #ddd !important;
        page-break-inside: avoid !important;
    }

    .observations-section h3 {
        font-size: 11pt !important;
        font-weight: bold !important;
        color: #333 !important;
        margin: 0 0 6px 0 !important;
        text-transform: uppercase !important;
    }

    .observations-text {
        color: #333 !important;
        font-size: 9pt !important;
        line-height: 1.3 !important;
        margin: 0 !important;
    }

    .receipt-footer {
        border-top: 2px solid #333 !important;
        padding-top: 12px !important;
        margin-top: 12px !important;
        page-break-inside: avoid !important;
    }

    .footer-note {
        text-align: center !important;
        margin-bottom: 8px !important;
    }

    .footer-note p {
        color: #666 !important;
        font-size: 9pt !important;
        margin: 2px 0 !important;
    }

    .footer-note p:first-child {
        font-weight: bold !important;
        color: #333 !important;
        font-size: 10pt !important;
    }

    .footer-signature {
        text-align: center !important;
        border-top: 1px solid #ddd !important;
        padding-top: 8px !important;
        margin-top: 8px !important;
    }

    .footer-signature p {
        color: #999 !important;
        font-size: 7pt !important;
        margin: 1px 0 !important;
    }

    /* Ocultar elementos del modal y navegador */
    .modal-actions,
    .p-dialog,
    .p-dialog-header,
    .p-dialog-footer,
    .p-component,
    nav,
    header,
    .sales-receipt-modal .p-dialog-content {
        display: none !important;
        visibility: hidden !important;
    }
}

/* Debug section */
.debug-section {
    background: #fff3cd !important;
    border: 1px solid #ffeaa7 !important;
    padding: 1rem !important;
    margin: 1rem 0 !important;
    border-radius: 8px !important;
    font-size: 0.875rem !important;
}

.debug-section p {
    margin: 0.25rem 0 !important;
    color: #856404 !important;
}

.no-products-message {
    text-align: center;
    padding: 2rem;
    color: #64748b;
    font-style: italic;
}

/* Ocultar debug en impresión */
@media print {
    .debug-section {
        display: none !important;
    }
}

/* Responsive */
@media (max-width: 768px) {
    .receipt-preview {
        padding: 1rem;
    }

    .company-header {
        flex-direction: column;
        gap: 1rem;
    }

    .logo-image {
        width: 60px;
        height: 60px;
    }

    .company-name {
        font-size: 1.5rem;
    }

    .receipt-dates {
        gap: 0.25rem;
    }

    .date-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
    }

    .products-table {
        font-size: 0.75rem;
    }

    .products-table th,
    .products-table td {
        padding: 0.5rem 0.25rem;
    }

    .totals-table {
        width: 100%;
    }
}
</style>
