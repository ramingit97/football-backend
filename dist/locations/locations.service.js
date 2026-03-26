"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const district_entity_1 = require("./entities/district.entity");
const metro_station_entity_1 = require("./entities/metro-station.entity");
let LocationsService = class LocationsService {
    constructor(districtsRepository, metroStationsRepository) {
        this.districtsRepository = districtsRepository;
        this.metroStationsRepository = metroStationsRepository;
    }
    async getDistricts() {
        return this.districtsRepository.find();
    }
    async createDistrict(name, city = 'Baku') {
        const district = this.districtsRepository.create({ name, city });
        return this.districtsRepository.save(district);
    }
    async getMetroStations() {
        return this.metroStationsRepository.find();
    }
    async createMetroStation(name, city = 'Baku', line) {
        const station = this.metroStationsRepository.create({ name, city, line });
        return this.metroStationsRepository.save(station);
    }
};
exports.LocationsService = LocationsService;
exports.LocationsService = LocationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(district_entity_1.District)),
    __param(1, (0, typeorm_1.InjectRepository)(metro_station_entity_1.MetroStation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], LocationsService);
//# sourceMappingURL=locations.service.js.map