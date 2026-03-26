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
exports.LocationsController = void 0;
const common_1 = require("@nestjs/common");
const locations_service_1 = require("./locations.service");
let LocationsController = class LocationsController {
    constructor(locationsService) {
        this.locationsService = locationsService;
    }
    getDistricts() {
        return this.locationsService.getDistricts();
    }
    createDistrict(name, city) {
        return this.locationsService.createDistrict(name, city);
    }
    getMetroStations() {
        return this.locationsService.getMetroStations();
    }
    createMetroStation(name, city, line) {
        return this.locationsService.createMetroStation(name, city, line);
    }
};
exports.LocationsController = LocationsController;
__decorate([
    (0, common_1.Get)('districts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LocationsController.prototype, "getDistricts", null);
__decorate([
    (0, common_1.Post)('districts'),
    __param(0, (0, common_1.Body)('name')),
    __param(1, (0, common_1.Body)('city')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LocationsController.prototype, "createDistrict", null);
__decorate([
    (0, common_1.Get)('metro'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LocationsController.prototype, "getMetroStations", null);
__decorate([
    (0, common_1.Post)('metro'),
    __param(0, (0, common_1.Body)('name')),
    __param(1, (0, common_1.Body)('city')),
    __param(2, (0, common_1.Body)('line')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], LocationsController.prototype, "createMetroStation", null);
exports.LocationsController = LocationsController = __decorate([
    (0, common_1.Controller)('locations'),
    __metadata("design:paramtypes", [locations_service_1.LocationsService])
], LocationsController);
//# sourceMappingURL=locations.controller.js.map