import { Controller, Get, Post, Body } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
    constructor(private readonly locationsService: LocationsService) { }

    @Get('districts')
    getDistricts() {
        return this.locationsService.getDistricts();
    }

    @Post('districts')
    createDistrict(@Body('name') name: string, @Body('city') city?: string) {
        return this.locationsService.createDistrict(name, city);
    }

    @Get('metro')
    getMetroStations() {
        return this.locationsService.getMetroStations();
    }

    @Post('metro')
    createMetroStation(@Body('name') name: string, @Body('city') city?: string, @Body('line') line?: string) {
        return this.locationsService.createMetroStation(name, city, line);
    }
}
