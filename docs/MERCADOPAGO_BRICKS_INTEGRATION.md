# MercadoPago Checkout Bricks Integration

Esta documentación explica cómo implementar y usar la integración de MercadoPago Checkout Bricks en la aplicación Master Color Frontend.

## 📋 Características Implementadas

### ✅ **Componentes Creados**

1. **MercadoPagoService** (`src/services/mercadopagoService.js`)
   - Servicio singleton para manejar la inicialización de MercadoPago
   - Métodos para crear Card Payment Brick, Wallet Brick y Status Screen Brick
   - Configuración automática con variables de entorno
   - Manejo de errores y fallbacks

2. **MercadoPagoCheckout** (`src/components/payment/MercadoPagoCheckout.vue`)
   - Componente principal para el checkout con Bricks
   - Soporte para múltiples métodos de pago
   - Validación de pagos y manejo de estados
   - Interfaz responsive y accesible

3. **PaymentModal Actualizado** (`src/views/orders/PaymentModal.vue`)
   - Integración con Checkout Bricks
   - Fallback al método clásico de MercadoPago
   - Manejo de estados de carga y errores

### ✅ **API Integration**

- Nuevos endpoints en `src/api/index.js` para pagos con Bricks
- Procesamiento de pagos a través del backend
- Verificación de estado de pagos
- Historial de transacciones

## 🚀 Configuración

### 1. Variables de Entorno

Añadir las siguientes variables en tu archivo `.env`:

```bash
# MercadoPago Configuration
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-tu-clave-publica-aqui
VITE_APP_FRONTEND_URL=http://localhost:5173
```

### 2. Claves de MercadoPago

Para obtener las claves de MercadoPago:

1. Ir a [MercadoPago Developers](https://www.mercadopago.com.pe/developers)
2. Crear una aplicación
3. Obtener las claves de prueba (TEST) y producción (PROD)
4. Configurar webhook URLs para notificaciones

**Formato de claves:**
- Test: `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Producción: `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

## 💳 Métodos de Pago Soportados

### 1. **Card Payment Brick**
- Tarjetas de crédito y débito
- Validación en tiempo real
- Detección automática de emisor
- Cálculo de cuotas disponibles

### 2. **Wallet Brick**
- Cuenta MercadoPago
- Pago con saldo disponible
- Integración con QR
- Pago rápido sin formularios

### 3. **Bank Transfer**
- Transferencia bancaria manual
- Generación de datos bancarios
- Confirmación manual de pago

## 🔧 Uso del Componente

### Ejemplo Básico

```vue
<template>
  <MercadoPagoCheckout
    :order-data="orderData"
    :preference-data="preferenceData"
    @payment-success="handlePaymentSuccess"
    @payment-error="handlePaymentError"
    @payment-pending="handlePaymentPending"
  />
</template>

<script setup>
import MercadoPagoCheckout from '@/components/payment/MercadoPagoCheckout.vue'

const orderData = {
  id: 123,
  subtotal: 100.00,
  shipping_cost: 10.00,
  discount: 0.00,
  total: 110.00
}

const preferenceData = {
  preference_id: 'xxx-xxx-xxx',
  init_point: 'https://...',
  sandbox_init_point: 'https://...'
}

const handlePaymentSuccess = (data) => {
  console.log('Payment successful:', data)
  // Redirigir o mostrar confirmación
}

const handlePaymentError = (error) => {
  console.error('Payment error:', error)
  // Mostrar mensaje de error
}

const handlePaymentPending = (data) => {
  console.log('Payment pending:', data)
  // Mostrar estado pendiente
}
</script>
```

### Props del Componente

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `orderData` | Object | ✅ | Datos de la orden (id, total, subtotal, etc.) |
| `preferenceData` | Object | ❌ | Datos de preferencia de MercadoPago |

### Eventos Emitidos

| Evento | Descripción | Datos |
|--------|-------------|-------|
| `payment-success` | Pago completado exitosamente | `{ orderId, paymentId, status }` |
| `payment-error` | Error en el procesamiento | `{ error, message, code }` |
| `payment-pending` | Pago pendiente de confirmación | `{ orderId, paymentId, status }` |

## 🔐 Seguridad

### Validaciones Implementadas

1. **Validación de Stock**: Verificación antes del pago
2. **Autenticación**: Token JWT requerido
3. **Validación de Tarjeta**: Usando algoritmos de MercadoPago
4. **Detección de Fraude**: Integración con sistemas de MercadoPago
5. **Encriptación**: Datos sensibles encriptados en tránsito

### Mejores Prácticas

- Nunca almacenar datos de tarjeta en el frontend
- Usar HTTPS en producción
- Validar todos los datos en el backend
- Implementar rate limiting
- Monitorear transacciones sospechosas

## 🎨 Personalización

### Themes y Estilos

El componente soporta personalización a través de variables CSS:

```css
:deep(.mp-card-payment-brick) {
  --mp-primary-color: #6366f1;
  --mp-secondary-color: #f3f4f6;
  --mp-border-radius: 8px;
  --mp-background-color: #ffffff;
}
```

### Configuración Avanzada

```javascript
const brickOptions = {
  appearance: {
    theme: 'default', // 'default', 'dark', 'bootstrap'
    variables: {
      colorPrimary: '#6366f1',
      colorSecondary: '#f3f4f6',
      borderRadius: '8px'
    }
  },
  callbacks: {
    onReady: () => console.log('Brick ready'),
    onSubmit: async (data) => await processPayment(data),
    onError: (error) => console.error('Brick error:', error)
  }
}
```

## 📱 Responsive Design

El componente está optimizado para:

- **Desktop**: Formulario completo con todas las opciones
- **Tablet**: Layout adaptativo con elementos redimensionados
- **Mobile**: Interfaz simplificada y touch-friendly

### Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  /* Estilos para móvil */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* Estilos para tablet */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Estilos para desktop */
}
```

## 🔄 Estados del Pago

### Estados Posibles

1. **pending**: Pago iniciado, esperando confirmación
2. **approved**: Pago aprobado y procesado
3. **rejected**: Pago rechazado
4. **in_process**: Pago en procesamiento
5. **cancelled**: Pago cancelado

### Manejo de Estados

```javascript
const handlePaymentStatus = (status) => {
  switch (status) {
    case 'approved':
      showSuccessMessage()
      redirectToConfirmation()
      break
    case 'rejected':
      showErrorMessage()
      allowRetry()
      break
    case 'in_process':
      showPendingMessage()
      startStatusPolling()
      break
    default:
      showGenericMessage()
  }
}
```

## 🧪 Testing

### Tarjetas de Prueba

Para testing, usar las siguientes tarjetas:

```javascript
const testCards = {
  approved: {
    number: '4170 0688 1010 8020',
    cvv: '123',
    expiry: '12/25'
  },
  rejected: {
    number: '4007 0000 0000 0008',
    cvv: '123',
    expiry: '12/25'
  },
  pending: {
    number: '4009 1790 5454 6351',
    cvv: '123',
    expiry: '12/25'
  }
}
```

### Usuarios de Prueba

```javascript
const testUsers = {
  buyer: {
    email: 'test_user_123@testuser.com',
    password: 'qatest123'
  },
  seller: {
    email: 'test_user_456@testuser.com',
    password: 'qatest123'
  }
}
```

## 🚨 Troubleshooting

### Errores Comunes

1. **"Invalid public key"**
   - Verificar que la clave pública esté correcta
   - Confirmar que las variables de entorno estén cargadas

2. **"Brick failed to load"**
   - Verificar conexión a internet
   - Comprobar que el contenedor DOM existe
   - Verificar que no hay conflictos de CSS

3. **"Payment processing failed"**
   - Verificar configuración del backend
   - Comprobar que los endpoints estén disponibles
   - Revisar logs del servidor

### Debug Mode

Para activar el modo debug:

```javascript
// En el servicio de MercadoPago
const mp = new window.MercadoPago(publicKey, {
  locale: 'es-PE',
  debug: true // Activar solo en desarrollo
})
```

## 📈 Monitoreo

### Métricas Importantes

- Tasa de conversión de pagos
- Tiempo de procesamiento
- Errores por tipo
- Métodos de pago preferidos
- Abandono en checkout

### Logs

Implementar logging para:

```javascript
// Eventos importantes
console.log('Payment initiated', { orderId, amount, method })
console.log('Payment completed', { orderId, paymentId, status })
console.error('Payment failed', { orderId, error, method })
```

## 📞 Soporte

### Documentación Oficial

- [MercadoPago Checkout Bricks](https://www.mercadopago.com.pe/developers/es/docs/checkout-bricks)
- [MercadoPago JavaScript SDK](https://github.com/mercadopago/sdk-js)

### Contacto

Para soporte técnico:
- Email: developers@mercadopago.com
- Documentación: https://www.mercadopago.com.pe/developers
- GitHub: https://github.com/mercadopago

---

## 🎯 Próximas Mejoras

### Roadmap

1. **v2.0**: Implementar Apple Pay y Google Pay
2. **v2.1**: Agregar soporte para criptomonedas
3. **v2.2**: Implementar pagos recurrentes
4. **v2.3**: Agregar checkout express
5. **v3.0**: Migrar a Web Components

### Contribuir

Para contribuir al proyecto:

1. Fork el repositorio
2. Crear una rama feature
3. Hacer commits descriptivos
4. Crear pull request
5. Agregar tests

---

*Última actualización: $(date)*
*Versión: 1.0.0*