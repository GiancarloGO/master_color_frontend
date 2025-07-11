import ubigeoData from '@/service/ubigeoPeru.json';

// UbigeoComplete utility class using complete Peru data
export class UbigeoComplete {
    constructor() {
        this.data = ubigeoData;
    }

    // Get all unique departments
    getDepartments() {
        const uniqueDepartments = new Map();

        this.data.forEach((item) => {
            if (!uniqueDepartments.has(item.Departamento)) {
                uniqueDepartments.set(item.Departamento, {
                    label: item.Departamento,
                    value: item.Departamento,
                    name: item.Departamento
                });
            }
        });

        return Array.from(uniqueDepartments.values()).sort((a, b) => a.label.localeCompare(b.label));
    }

    // Get provinces by department name
    getProvincesByDepartment(departmentName) {
        const uniqueProvinces = new Map();

        this.data
            .filter((item) => item.Departamento === departmentName)
            .forEach((item) => {
                if (!uniqueProvinces.has(item.Provincia)) {
                    uniqueProvinces.set(item.Provincia, {
                        label: item.Provincia,
                        value: item.Provincia,
                        name: item.Provincia,
                        department: item.Departamento
                    });
                }
            });

        return Array.from(uniqueProvinces.values()).sort((a, b) => a.label.localeCompare(b.label));
    }

    // Get districts by province name
    getDistrictsByProvince(provinceName) {
        const districts = this.data
            .filter((item) => item.Provincia === provinceName)
            .map((item) => ({
                label: item.Distrito,
                value: item.Distrito,
                name: item.Distrito,
                province: item.Provincia,
                department: item.Departamento,
                ubigeo: item.Ubigeo,
                postalCode: this.generatePostalCode(item.Ubigeo)
            }));

        return districts.sort((a, b) => a.label.localeCompare(b.label));
    }

    // Generate postal code from ubigeo (first 5 digits)
    generatePostalCode(ubigeo) {
        if (ubigeo && ubigeo.length >= 5) {
            return ubigeo.substring(0, 5);
        }
        return null;
    }

    // Get location name by value (for backwards compatibility)
    getLocationName(locations, value) {
        const location = locations.find((loc) => loc.value === value);
        return location ? location.name : '';
    }

    // Get department by name
    getDepartmentByName(name) {
        return this.data.find((item) => item.Departamento === name);
    }

    // Get province by name and department
    getProvinceByName(provinceName, departmentName) {
        return this.data.find((item) => item.Provincia === provinceName && item.Departamento === departmentName);
    }

    // Get district by name and province
    getDistrictByName(districtName, provinceName) {
        return this.data.find((item) => item.Distrito === districtName && item.Provincia === provinceName);
    }

    // Search locations by text
    searchLocations(searchText, type = 'all') {
        const text = searchText.toLowerCase().trim();
        if (text.length < 2) return [];

        const results = [];
        const seen = new Set();

        this.data.forEach((item) => {
            if (type === 'department' || type === 'all') {
                if (item.Departamento.toLowerCase().includes(text) && !seen.has(`dept_${item.Departamento}`)) {
                    results.push({
                        type: 'department',
                        name: item.Departamento,
                        fullPath: item.Departamento
                    });
                    seen.add(`dept_${item.Departamento}`);
                }
            }

            if (type === 'province' || type === 'all') {
                if (item.Provincia.toLowerCase().includes(text) && !seen.has(`prov_${item.Provincia}_${item.Departamento}`)) {
                    results.push({
                        type: 'province',
                        name: item.Provincia,
                        department: item.Departamento,
                        fullPath: `${item.Provincia}, ${item.Departamento}`
                    });
                    seen.add(`prov_${item.Provincia}_${item.Departamento}`);
                }
            }

            if (type === 'district' || type === 'all') {
                if (item.Distrito.toLowerCase().includes(text) && !seen.has(`dist_${item.Ubigeo}`)) {
                    results.push({
                        type: 'district',
                        name: item.Distrito,
                        province: item.Provincia,
                        department: item.Departamento,
                        ubigeo: item.Ubigeo,
                        fullPath: `${item.Distrito}, ${item.Provincia}, ${item.Departamento}`
                    });
                    seen.add(`dist_${item.Ubigeo}`);
                }
            }
        });

        return results.slice(0, 20); // Limit results
    }

    // Get total count of locations
    getCounts() {
        const departments = new Set();
        const provinces = new Set();
        const districts = new Set();

        this.data.forEach((item) => {
            departments.add(item.Departamento);
            provinces.add(`${item.Provincia}_${item.Departamento}`);
            districts.add(item.Ubigeo);
        });

        return {
            departments: departments.size,
            provinces: provinces.size,
            districts: districts.size
        };
    }
}
