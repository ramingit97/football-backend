import { LocationsService } from './locations.service';
export declare class LocationsController {
    private readonly locationsService;
    constructor(locationsService: LocationsService);
    getDistricts(): Promise<import("./entities/district.entity").District[]>;
    createDistrict(name: string, city?: string): Promise<import("./entities/district.entity").District>;
    getMetroStations(): Promise<import("./entities/metro-station.entity").MetroStation[]>;
    createMetroStation(name: string, city?: string, line?: string): Promise<import("./entities/metro-station.entity").MetroStation>;
}
