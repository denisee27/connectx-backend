export default {
    async getCountries(req, res, next) {
        try {
            const placeService = req.scope.resolve("placeService");
            const countries = await placeService.getCountries();
            res.status(200).json(countries);
        } catch (error) {
            next(error);
        }
    },
    async getRegions(req, res, next) {
        try {
            const placeService = req.scope.resolve("placeService");
            const regions = await placeService.getRegions();
            res.status(200).json(regions);
        } catch (error) {
            next(error);
        }
    },
    async getCities(req, res, next) {
        try {
            const placeService = req.scope.resolve("placeService");
            const cities = await placeService.getCities();
            res.status(200).json(cities);
        } catch (error) {
            next(error);
        }
    },
    async getCitiesByCountryId(req, res, next) {
        try {
            const placeService = req.scope.resolve("placeService");
            const { countryId } = req.params;
            const cities = await placeService.getCitiesByCountryId(countryId);
            res.status(200).json(cities);
        } catch (error) {
            next(error);
        }
    },
    async getRoomsFromRegion(req, res, next) {
        try {
            const placeService = req.scope.resolve("placeService");
            const rooms = await placeService.findRoomsFromRegion();
            res.status(200).json(rooms);
        } catch (error) {
            next(error);
        }
    },
    async getRoomsFromCity(req, res, next) {
        try {
            const placeService = req.scope.resolve("placeService");
            const { cityId } = req.params;
            const rooms = await placeService.RoomsFromCity(cityId);
            res.status(200).json(rooms);
        } catch (error) {
            next(error);
        }
    },
};