export function makePlaceService({ cityRepository, regionRepository, countryRepository }) {
    return {
        async getCountries() {
            return countryRepository.findAll();
        },
        async getRegions() {
            return regionRepository.findAll();
        },
        async getCitiesByCountryId(countryId) {
            return cityRepository.findByCountryId(countryId);
        },
        async findRoomsFromRegion() {
            return regionRepository.findRoomsFromRegion();
        },
        async RoomsFromCity(cityId) {
            return cityRepository.RoomsFromCity(cityId);
        },
    };
}