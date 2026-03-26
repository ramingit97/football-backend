import { Repository } from 'typeorm';
import { District } from './entities/district.entity';
import { MetroStation } from './entities/metro-station.entity';
export declare class LocationsService {
    private districtsRepository;
    private metroStationsRepository;
    constructor(districtsRepository: Repository<District>, metroStationsRepository: Repository<MetroStation>);
    getDistricts(): Promise<District[]>;
    createDistrict(name: string, city?: string): Promise<District>;
    getMetroStations(): Promise<MetroStation[]>;
    createMetroStation(name: string, city?: string, line?: string): Promise<MetroStation>;
}
