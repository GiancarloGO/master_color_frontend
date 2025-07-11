// Ubigeo data for Peru - Common departments, provinces, and districts
export const ubigeoData = {
    departments: [
        { id: '01', name: 'Amazonas' },
        { id: '02', name: 'Áncash' },
        { id: '03', name: 'Apurímac' },
        { id: '04', name: 'Arequipa' },
        { id: '05', name: 'Ayacucho' },
        { id: '06', name: 'Cajamarca' },
        { id: '07', name: 'Callao' },
        { id: '08', name: 'Cusco' },
        { id: '09', name: 'Huancavelica' },
        { id: '10', name: 'Huánuco' },
        { id: '11', name: 'Ica' },
        { id: '12', name: 'Junín' },
        { id: '13', name: 'La Libertad' },
        { id: '14', name: 'Lambayeque' },
        { id: '15', name: 'Lima' },
        { id: '16', name: 'Loreto' },
        { id: '17', name: 'Madre de Dios' },
        { id: '18', name: 'Moquegua' },
        { id: '19', name: 'Pasco' },
        { id: '20', name: 'Piura' },
        { id: '21', name: 'Puno' },
        { id: '22', name: 'San Martín' },
        { id: '23', name: 'Tacna' },
        { id: '24', name: 'Tumbes' },
        { id: '25', name: 'Ucayali' }
    ],

    provinces: {
        15: [
            // Lima
            { id: '1501', name: 'Lima', departmentId: '15' },
            { id: '1502', name: 'Barranca', departmentId: '15' },
            { id: '1503', name: 'Cajatambo', departmentId: '15' },
            { id: '1504', name: 'Canta', departmentId: '15' },
            { id: '1505', name: 'Cañete', departmentId: '15' },
            { id: '1506', name: 'Huaral', departmentId: '15' },
            { id: '1507', name: 'Huarochirí', departmentId: '15' },
            { id: '1508', name: 'Huaura', departmentId: '15' },
            { id: '1509', name: 'Oyón', departmentId: '15' },
            { id: '1510', name: 'Yauyos', departmentId: '15' }
        ],
        '07': [
            // Callao
            { id: '0701', name: 'Callao', departmentId: '07' }
        ],
        '04': [
            // Arequipa
            { id: '0401', name: 'Arequipa', departmentId: '04' },
            { id: '0402', name: 'Camaná', departmentId: '04' },
            { id: '0403', name: 'Caravelí', departmentId: '04' },
            { id: '0404', name: 'Castilla', departmentId: '04' },
            { id: '0405', name: 'Caylloma', departmentId: '04' },
            { id: '0406', name: 'Condesuyos', departmentId: '04' },
            { id: '0407', name: 'Islay', departmentId: '04' },
            { id: '0408', name: 'La Unión', departmentId: '04' }
        ]
    },

    districts: {
        1501: [
            // Lima Province
            { id: '150101', name: 'Lima', provinceId: '1501', postalCode: '15001' },
            { id: '150102', name: 'Ancón', provinceId: '1501', postalCode: '15002' },
            { id: '150103', name: 'Ate', provinceId: '1501', postalCode: '15012' },
            { id: '150104', name: 'Barranco', provinceId: '1501', postalCode: '15063' },
            { id: '150105', name: 'Breña', provinceId: '1501', postalCode: '15082' },
            { id: '150106', name: 'Carabayllo', provinceId: '1501', postalCode: '15121' },
            { id: '150107', name: 'Chaclacayo', provinceId: '1501', postalCode: '15131' },
            { id: '150108', name: 'Chorrillos', provinceId: '1501', postalCode: '15056' },
            { id: '150109', name: 'Cieneguilla', provinceId: '1501', postalCode: '15132' },
            { id: '150110', name: 'Comas', provinceId: '1501', postalCode: '15314' },
            { id: '150111', name: 'El Agustino', provinceId: '1501', postalCode: '15007' },
            { id: '150112', name: 'Independencia', provinceId: '1501', postalCode: '15332' },
            { id: '150113', name: 'Jesús María', provinceId: '1501', postalCode: '15072' },
            { id: '150114', name: 'La Molina', provinceId: '1501', postalCode: '15026' },
            { id: '150115', name: 'La Victoria', provinceId: '1501', postalCode: '15033' },
            { id: '150116', name: 'Lince', provinceId: '1501', postalCode: '15073' },
            { id: '150117', name: 'Los Olivos', provinceId: '1501', postalCode: '15301' },
            { id: '150118', name: 'Lurigancho', provinceId: '1501', postalCode: '15420' },
            { id: '150119', name: 'Lurin', provinceId: '1501', postalCode: '15021' },
            { id: '150120', name: 'Magdalena del Mar', provinceId: '1501', postalCode: '15076' },
            { id: '150121', name: 'Pueblo Libre', provinceId: '1501', postalCode: '15084' },
            { id: '150122', name: 'Miraflores', provinceId: '1501', postalCode: '15074' },
            { id: '150123', name: 'Pachacamac', provinceId: '1501', postalCode: '15823' },
            { id: '150124', name: 'Pucusana', provinceId: '1501', postalCode: '15829' },
            { id: '150125', name: 'Puente Piedra', provinceId: '1501', postalCode: '15117' },
            { id: '150126', name: 'Punta Hermosa', provinceId: '1501', postalCode: '15846' },
            { id: '150127', name: 'Punta Negra', provinceId: '1501', postalCode: '15849' },
            { id: '150128', name: 'Rímac', provinceId: '1501', postalCode: '15093' },
            { id: '150129', name: 'San Bartolo', provinceId: '1501', postalCode: '15852' },
            { id: '150130', name: 'San Borja', provinceId: '1501', postalCode: '15036' },
            { id: '150131', name: 'San Isidro', provinceId: '1501', postalCode: '15073' },
            { id: '150132', name: 'San Juan de Lurigancho', provinceId: '1501', postalCode: '15434' },
            { id: '150133', name: 'San Juan de Miraflores', provinceId: '1501', postalCode: '15801' },
            { id: '150134', name: 'San Luis', provinceId: '1501', postalCode: '15021' },
            { id: '150135', name: 'San Martín de Porres', provinceId: '1501', postalCode: '15102' },
            { id: '150136', name: 'San Miguel', provinceId: '1501', postalCode: '15087' },
            { id: '150137', name: 'Santa Anita', provinceId: '1501', postalCode: '15009' },
            { id: '150138', name: 'Santa María del Mar', provinceId: '1501', postalCode: '15856' },
            { id: '150139', name: 'Santa Rosa', provinceId: '1501', postalCode: '15113' },
            { id: '150140', name: 'Santiago de Surco', provinceId: '1501', postalCode: '15038' },
            { id: '150141', name: 'Surquillo', provinceId: '1501', postalCode: '15047' },
            { id: '150142', name: 'Villa El Salvador', provinceId: '1501', postalCode: '15842' },
            { id: '150143', name: 'Villa María del Triunfo', provinceId: '1501', postalCode: '15817' }
        ],
        '0701': [
            // Callao Province
            { id: '070101', name: 'Callao', provinceId: '0701', postalCode: '07001' },
            { id: '070102', name: 'Bellavista', provinceId: '0701', postalCode: '07011' },
            { id: '070103', name: 'Carmen de la Legua Reynoso', provinceId: '0701', postalCode: '07021' },
            { id: '070104', name: 'La Perla', provinceId: '0701', postalCode: '07016' },
            { id: '070105', name: 'La Punta', provinceId: '0701', postalCode: '07026' },
            { id: '070106', name: 'Ventanilla', provinceId: '0701', postalCode: '07056' },
            { id: '070107', name: 'Mi Perú', provinceId: '0701', postalCode: '07061' }
        ],
        '0401': [
            // Arequipa Province
            { id: '040101', name: 'Arequipa', provinceId: '0401', postalCode: '04001' },
            { id: '040102', name: 'Alto Selva Alegre', provinceId: '0401', postalCode: '04007' },
            { id: '040103', name: 'Cayma', provinceId: '0401', postalCode: '04008' },
            { id: '040104', name: 'Cerro Colorado', provinceId: '0401', postalCode: '04013' },
            { id: '040105', name: 'Characato', provinceId: '0401', postalCode: '04014' },
            { id: '040106', name: 'Chiguata', provinceId: '0401', postalCode: '04015' },
            { id: '040107', name: 'Jacobo Hunter', provinceId: '0401', postalCode: '04016' },
            { id: '040108', name: 'La Joya', provinceId: '0401', postalCode: '04017' },
            { id: '040109', name: 'Mariano Melgar', provinceId: '0401', postalCode: '04018' },
            { id: '040110', name: 'Miraflores', provinceId: '0401', postalCode: '04019' },
            { id: '040111', name: 'Mollebaya', provinceId: '0401', postalCode: '04020' },
            { id: '040112', name: 'Paucarpata', provinceId: '0401', postalCode: '04021' },
            { id: '040113', name: 'Pocsi', provinceId: '0401', postalCode: '04022' },
            { id: '040114', name: 'Polobaya', provinceId: '0401', postalCode: '04023' },
            { id: '040115', name: 'Quequeña', provinceId: '0401', postalCode: '04024' },
            { id: '040116', name: 'Sabandia', provinceId: '0401', postalCode: '04025' },
            { id: '040117', name: 'Sachaca', provinceId: '0401', postalCode: '04026' },
            { id: '040118', name: 'San Juan de Siguas', provinceId: '0401', postalCode: '04027' },
            { id: '040119', name: 'San Juan de Tarucani', provinceId: '0401', postalCode: '04028' },
            { id: '040120', name: 'Santa Isabel de Siguas', provinceId: '0401', postalCode: '04029' },
            { id: '040121', name: 'Santa Rita de Siguas', provinceId: '0401', postalCode: '04030' },
            { id: '040122', name: 'Socabaya', provinceId: '0401', postalCode: '04031' },
            { id: '040123', name: 'Tiabaya', provinceId: '0401', postalCode: '04032' },
            { id: '040124', name: 'Uchumayo', provinceId: '0401', postalCode: '04033' },
            { id: '040125', name: 'Vitor', provinceId: '0401', postalCode: '04034' },
            { id: '040126', name: 'Yanahuara', provinceId: '0401', postalCode: '04035' },
            { id: '040127', name: 'Yarabamba', provinceId: '0401', postalCode: '04036' },
            { id: '040128', name: 'Yura', provinceId: '0401', postalCode: '04037' }
        ]
    }
};

// Ubigeo utility class
export class UbigeoUtil {
    getDepartments() {
        return ubigeoData.departments.map((dept) => ({
            label: dept.name,
            value: dept.id,
            code: dept.id,
            name: dept.name
        }));
    }

    getProvincesByDepartment(departmentId) {
        const provinces = ubigeoData.provinces[departmentId] || [];
        return provinces.map((prov) => ({
            label: prov.name,
            value: prov.id,
            code: prov.id,
            name: prov.name
        }));
    }

    getDistrictsByProvince(provinceId) {
        const districts = ubigeoData.districts[provinceId] || [];
        return districts.map((dist) => ({
            label: dist.name,
            value: dist.id,
            code: dist.id,
            name: dist.name,
            postalCode: dist.postalCode
        }));
    }

    getLocationName(locations, code) {
        const location = locations.find((loc) => loc.value === code);
        return location ? location.name : '';
    }
}
