const FIELD_LABELS = {
    name: 'nombre',
    sku: 'código SKU',
    barcode: 'código de barras',
    brand: 'marca',
    category: 'categoría',
    presentation: 'presentación',
    unidad: 'unidad de medida',
    description: 'descripción',
    image: 'imagen',
    purchase_price: 'precio de compra',
    sale_price: 'precio de venta',
    quantity: 'cantidad inicial',
    min_stock: 'stock mínimo',
    max_stock: 'stock máximo',
    default_warranty_months: 'meses de garantía'
};

const FRIENDLY_BY_FIELD = {
    name: {
        unique: 'Ya tienes otro producto registrado con este nombre.',
        required: 'Ingresa un nombre para identificar el producto.',
        max: 'El nombre es demasiado largo (máximo 255 caracteres).'
    },
    sku: {
        unique: 'Este código SKU ya pertenece a otro producto. Usa uno distinto.',
        required: 'Ingresa el código SKU del producto.',
        max: 'El código SKU es demasiado largo (máximo 255 caracteres).'
    },
    barcode: {
        unique: 'Este código de barras ya está asignado a otro producto.',
        max: 'El código de barras es demasiado largo (máximo 255 caracteres).'
    },
    category: {
        required: 'Selecciona una categoría para el producto.'
    },
    unidad: {
        required: 'Selecciona la unidad de medida del producto.'
    },
    image: {
        uploaded: 'No pudimos cargar la imagen. Asegúrate de que pese menos de 2 MB.',
        max: 'La imagen es demasiado pesada. El máximo permitido es 2 MB.',
        mimes: 'Formato no compatible. Usa una imagen JPG, PNG o WEBP.',
        image: 'El archivo seleccionado no es una imagen válida.'
    },
    purchase_price: {
        required: 'Ingresa el precio de compra.',
        min: 'El precio de compra debe ser mayor a S/ 0.00.',
        max: 'El precio de compra supera el límite permitido.'
    },
    sale_price: {
        required: 'Ingresa el precio de venta.',
        min: 'El precio de venta debe ser mayor a S/ 0.00.',
        max: 'El precio de venta supera el límite permitido.'
    }
};

function detectRuleKey(raw) {
    const lower = raw.toLowerCase();

    if (lower.includes('validation.uploaded') || lower.includes('failed to upload') || lower.includes('no se pudo subir')) return 'uploaded';
    if (lower.includes('validation.unique') || lower.includes('ya existe')) return 'unique';
    if (lower.includes('validation.required') || lower.includes('obligatorio') || lower.includes('requerido')) return 'required';
    if (lower.includes('validation.mimes') || lower.includes('formato') || lower.includes('tipo:')) return 'mimes';
    if (lower.includes('validation.image') || lower.includes('imagen válida')) return 'image';
    if (lower.includes('validation.max') || lower.includes('no puede exceder') || lower.includes('más de') || lower.includes('mayor a')) return 'max';
    if (lower.includes('validation.min') || lower.includes('al menos') || lower.includes('negativ')) return 'min';

    return null;
}

/**
 * Convierte errores crudos de validación del backend (incluyendo claves `validation.*`)
 * en mensajes claros y amigables para el usuario final.
 */
export function humanizeFieldError(field, rawMessage) {
    const raw = Array.isArray(rawMessage) ? String(rawMessage[0] ?? '') : String(rawMessage ?? '');
    const trimmed = raw.trim();
    const fieldRules = FRIENDLY_BY_FIELD[field];
    const ruleKey = detectRuleKey(trimmed);

    if (fieldRules && ruleKey && fieldRules[ruleKey]) {
        return fieldRules[ruleKey];
    }

    // Evita mostrar claves técnicas como `validation.uploaded` o mensajes en inglés/SQL
    if (!trimmed || /^validation\.[a-z0-9_.-]+$/i.test(trimmed) || /sqlstate|exception|the .+ field/i.test(trimmed)) {
        const label = FIELD_LABELS[field];
        return label ? `Verifica el valor ingresado en ${label}.` : 'Revisa este campo, el dato no es válido.';
    }

    return trimmed;
}

export function humanizeFieldErrors(fieldErrors) {
    if (!fieldErrors || Array.isArray(fieldErrors) || typeof fieldErrors !== 'object') {
        return {};
    }
    return Object.fromEntries(
        Object.entries(fieldErrors).map(([field, msg]) => [field, humanizeFieldError(field, msg)])
    );
}

export function humanizeErrorMessage(rawMessage, fallback = 'Ocurrió un problema al procesar tu solicitud. Inténtalo nuevamente.') {
    if (!rawMessage || typeof rawMessage !== 'string') return fallback;
    const trimmed = rawMessage.trim();
    if (!trimmed || /^validation\.[a-z0-9_.-]+$/i.test(trimmed) || /sqlstate|exception|error interno/i.test(trimmed)) {
        return fallback;
    }
    return trimmed;
}
