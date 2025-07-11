# 🚨 Troubleshooting MercadoPago Integration

Esta guía te ayudará a resolver los problemas más comunes con la integración de MercadoPago Checkout Bricks.

## 🔧 Problemas Comunes y Soluciones

### 1. **Error: "does not provide an export named 'loadMercadoPago'"**

**Causa**: Intento de usar la importación npm del SDK que no es compatible.

**Solución**: 
✅ La implementación actual carga el SDK dinámicamente via CDN
✅ No requiere el paquete npm `@mercadopago/sdk-js`
✅ El script se carga automáticamente desde `https://sdk.mercadopago.com/js/v2`

**Verificación**:
```javascript
// En la consola del navegador
console.log(window.MercadoPago)
// Debe mostrar la función constructor de MercadoPago
```

### 2. **Error: "MercadoPago public key is required"**

**Causa**: Variable de entorno no configurada o incorrecta.

**Solución**:
1. Verificar que existe el archivo `.env`:
```bash
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_APP_FRONTEND_URL=http://localhost:5173
```

2. Obtener clave real desde [MercadoPago Developers](https://www.mercadopago.com.pe/developers)

3. Reiniciar el servidor de desarrollo:
```bash
npm run dev
```

### 3. **Error: "Invalid MercadoPago public key format"**

**Causa**: Formato de clave público incorrecto.

**Formatos válidos**:
- **Test**: `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Producción**: `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

**Solución**: Verificar que la clave comience con `TEST-` o `APP_USR-`

### 4. **Error: "Failed to load MercadoPago script"**

**Causa**: Problemas de conectividad o bloqueo de CDN.

**Diagnóstico**:
```javascript
// Verificar conectividad
fetch('https://sdk.mercadopago.com/js/v2')
  .then(response => console.log('CDN accessible:', response.ok))
  .catch(error => console.log('CDN blocked:', error))
```

**Soluciones**:
1. **Verificar firewall/antivirus**: Asegurar que no bloquee mercadopago.com
2. **Proxy corporativo**: Configurar excepciones para mercadopago.com
3. **Usar fallback**: El componente automáticamente usa el método clásico

### 5. **Error: "Brick failed to load"**

**Causa**: Contenedor DOM no existe o CSS conflictivo.

**Diagnóstico**:
```javascript
// Verificar contenedor
document.getElementById('cardPaymentBrick')
// Debe retornar el elemento HTML
```

**Solución**:
1. Verificar que el contenedor existe antes de crear el brick
2. Revisar conflictos de CSS que oculten el contenedor
3. Usar `nextTick()` para asegurar que el DOM esté listo

### 6. **Error: "Payment processing failed"**

**Causa**: Problemas con endpoints del backend.

**Diagnóstico**:
```javascript
// Test de API
fetch('/api/client/payments/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: true })
})
```

**Solución**:
1. Verificar que el backend esté corriendo
2. Confirmar endpoints en `src/api/index.js`
3. Revisar autenticación JWT
4. Verificar logs del servidor

## 🧪 Herramientas de Debug

### Test Automático

Ejecutar en la consola del navegador:
```javascript
import { quickTest } from '@/utils/testMercadoPago'
quickTest()
```

### Debug Mode

Agregar parámetro a la URL:
```
http://localhost:5173?debug=mp
```

### Logs Detallados

Activar en `mercadopagoService.js`:
```javascript
const mp = new window.MercadoPago(publicKey, {
  locale: 'es-PE',
  debug: true // Solo en desarrollo
})
```

## 🔍 Verificación Paso a Paso

### 1. **Verificar Variables de Entorno**
```bash
# Verificar que las variables estén cargadas
echo $VITE_MERCADOPAGO_PUBLIC_KEY
```

### 2. **Verificar Carga del Script**
```javascript
// En la consola del navegador
console.log('MercadoPago available:', typeof window.MercadoPago)
console.log('Service instance:', window.mercadoPagoService)
```

### 3. **Verificar Inicialización**
```javascript
// Test manual de inicialización
import mercadoPagoService from '@/services/mercadopagoService'
mercadoPagoService.initialize()
  .then(mp => console.log('Initialized:', mp))
  .catch(error => console.error('Failed:', error))
```

### 4. **Verificar Bricks**
```javascript
// Verificar que el contenedor existe
const container = document.getElementById('cardPaymentBrick')
console.log('Container exists:', !!container)
console.log('Container visible:', container?.offsetWidth > 0)
```

## 🌐 Problemas de Red

### CORS Issues
Si hay problemas de CORS con MercadoPago:

1. **Verificar origen**: Asegurar que el dominio esté registrado en MercadoPago
2. **HTTPS en producción**: MercadoPago requiere HTTPS en producción
3. **Headers correctos**: Verificar que el servidor envíe headers CORS apropiados

### CDN Bloqueado
Si el CDN está bloqueado:

1. **Usar proxy local**: Configurar proxy en `vite.config.js`
2. **Whitelist**: Agregar `*.mercadopago.com` a whitelist
3. **Fallback**: Usar método clásico (redirección)

## 📱 Problemas Específicos del Dispositivo

### Mobile Issues
- **Viewport**: Verificar meta viewport en `index.html`
- **Touch events**: Asegurar que los bricks respondan al touch
- **Keyboard**: Verificar que el teclado no oculte elementos importantes

### iOS Safari
- **Cookies**: Verificar configuración de cookies SameSite
- **LocalStorage**: Confirmar que localStorage esté disponible
- **Payment APIs**: Verificar compatibilidad con Payment Request API

### Android Chrome
- **Autofill**: Deshabilitar autofill si interfiere con bricks
- **Zoom**: Configurar viewport para prevenir zoom automático
- **Performance**: Optimizar para dispositivos de baja gama

## 🔧 Configuración de Desarrollo

### Vite Configuration
```javascript
// vite.config.js
export default {
  define: {
    __MERCADOPAGO_DEBUG__: JSON.stringify(process.env.NODE_ENV === 'development')
  }
}
```

### Environment Variables
```bash
# .env.local (no commitear)
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-1234567890-abcdef-ghijkl-mnopqr-123456789
VITE_APP_FRONTEND_URL=http://localhost:5173

# .env.production
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-1234567890-abcdef-ghijkl-mnopqr-123456789
VITE_APP_FRONTEND_URL=https://tu-dominio.com
```

## 📞 Cuando Todo Falla

### 1. **Limpiar Caché**
```bash
# Limpiar caché de Vite
rm -rf node_modules/.vite
npm run dev
```

### 2. **Reinstalar Dependencias**
```bash
rm -rf node_modules package-lock.json
npm install
```

### 3. **Verificar Versiones**
- Node.js: >= 16.0.0
- Vue.js: >= 3.2.0
- Vite: >= 4.0.0

### 4. **Contactar Soporte**
- **MercadoPago**: developers@mercadopago.com
- **Documentación**: https://www.mercadopago.com.pe/developers
- **GitHub Issues**: Reportar problemas específicos

## 🎯 Testing en Diferentes Entornos

### Development
```bash
npm run dev
# URL: http://localhost:5173?debug=mp
```

### Staging
```bash
npm run build
npm run preview
# Usar claves de test
```

### Production
```bash
npm run build
# Usar claves de producción
# Verificar HTTPS
# Configurar webhooks
```

---

## 📋 Checklist de Verificación

Antes de reportar un problema, verificar:

- [ ] Variables de entorno configuradas
- [ ] Clave pública con formato correcto
- [ ] Script de MercadoPago se carga
- [ ] No hay errores en consola del navegador
- [ ] Contenedores DOM existen
- [ ] No hay conflictos de CSS
- [ ] Backend responde correctamente
- [ ] Red permite acceso a mercadopago.com
- [ ] Dispositivo/navegador es compatible

Si todos los elementos están ✅ y aún hay problemas, contactar soporte técnico con:
1. Logs completos de la consola
2. Configuración de variables de entorno (sin claves reales)
3. Pasos exactos para reproducir el problema
4. Información del navegador/dispositivo

---

*Última actualización: $(date)*