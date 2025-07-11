import postalData from '@/service/codPostalPeru.json';

// UbigeoPostal utility class using complete Peru postal data
export class UbigeoPostal {
    constructor() {
        this.data = postalData;
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
        const uniqueDistricts = new Map();

        this.data
            .filter((item) => item.Provincia === provinceName)
            .forEach((item) => {
                // Use distrito as unique key
                const key = `${item.Distritos}_${item.Provincia}`;
                if (!uniqueDistricts.has(key)) {
                    uniqueDistricts.set(key, {
                        label: item.Distritos,
                        value: item.Distritos,
                        name: item.Distritos,
                        province: item.Provincia,
                        department: item.Departamento,
                        postalCode: item['Codigo Postal'],
                        coordinates: {
                            lat: parseFloat(item.Y),
                            lng: parseFloat(item.X)
                        }
                    });
                }
            });

        return Array.from(uniqueDistricts.values()).sort((a, b) => a.label.localeCompare(b.label));
    }

    // Get postal codes for a specific district
    getPostalCodesByDistrict(districtName, provinceName) {
        return this.data
            .filter((item) => item.Distritos === districtName && item.Provincia === provinceName)
            .map((item) => ({
                postalCode: item['Codigo Postal'],
                capital: item.Capitales,
                coordinates: {
                    lat: parseFloat(item.Y),
                    lng: parseFloat(item.X)
                }
            }))
            .sort((a, b) => a.postalCode.localeCompare(b.postalCode));
    }

    // Get primary postal code for a district (first one found)
    getPrimaryPostalCode(districtName, provinceName) {
        const postalCodes = this.getPostalCodesByDistrict(districtName, provinceName);
        return postalCodes.length > 0 ? postalCodes[0].postalCode : null;
    }

    // Get location name by value (for backwards compatibility)
    getLocationName(locations, value) {
        const location = locations.find((loc) => loc.value === value);
        return location ? location.name : '';
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
                const key = `dist_${item.Distritos}_${item.Provincia}`;
                if (item.Distritos.toLowerCase().includes(text) && !seen.has(key)) {
                    results.push({
                        type: 'district',
                        name: item.Distritos,
                        province: item.Provincia,
                        department: item.Departamento,
                        postalCode: item['Codigo Postal'],
                        fullPath: `${item.Distritos}, ${item.Provincia}, ${item.Departamento}`
                    });
                    seen.add(key);
                }
            }

            // Search by postal code
            if (type === 'postal' || type === 'all') {
                if (item['Codigo Postal'].includes(text) && !seen.has(`postal_${item['Codigo Postal']}`)) {
                    results.push({
                        type: 'postal',
                        name: `${item['Codigo Postal']} - ${item.Distritos}`,
                        district: item.Distritos,
                        province: item.Provincia,
                        department: item.Departamento,
                        postalCode: item['Codigo Postal'],
                        fullPath: `${item['Codigo Postal']} - ${item.Distritos}, ${item.Provincia}, ${item.Departamento}`
                    });
                    seen.add(`postal_${item['Codigo Postal']}`);
                }
            }
        });

        return results.slice(0, 20); // Limit results
    }

    // Get all data for a specific location
    getLocationDetails(departmentName, provinceName = null, districtName = null) {
        let filtered = this.data.filter((item) => item.Departamento === departmentName);

        if (provinceName) {
            filtered = filtered.filter((item) => item.Provincia === provinceName);
        }

        if (districtName) {
            filtered = filtered.filter((item) => item.Distritos === districtName);
        }

        return filtered;
    }

    // Get statistics
    getCounts() {
        const departments = new Set();
        const provinces = new Set();
        const districts = new Set();
        const postalCodes = new Set();

        this.data.forEach((item) => {
            departments.add(item.Departamento);
            provinces.add(`${item.Provincia}_${item.Departamento}`);
            districts.add(`${item.Distritos}_${item.Provincia}`);
            postalCodes.add(item['Codigo Postal']);
        });

        return {
            departments: departments.size,
            provinces: provinces.size,
            districts: districts.size,
            postalCodes: postalCodes.size,
            totalRecords: this.data.length
        };
    }

    // Validate postal code format
    isValidPostalCode(postalCode) {
        return /^\d{5}$/.test(postalCode);
    }

    // Get nearby locations by coordinates (simple distance calculation)
    getNearbyLocations(lat, lng, radiusKm = 10) {
        const results = [];

        this.data.forEach((item) => {
            const itemLat = parseFloat(item.Y);
            const itemLng = parseFloat(item.X);

            if (!isNaN(itemLat) && !isNaN(itemLng)) {
                const distance = this.calculateDistance(lat, lng, itemLat, itemLng);

                if (distance <= radiusKm) {
                    results.push({
                        ...item,
                        distance: distance,
                        coordinates: {
                            lat: itemLat,
                            lng: itemLng
                        }
                    });
                }
            }
        });

        return results.sort((a, b) => a.distance - b.distance);
    }

    // Calculate distance between two points using Haversine formula
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
