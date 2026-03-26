import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { District } from './entities/district.entity';
import { MetroStation } from './entities/metro-station.entity';

@Injectable()
export class LocationsService {
    constructor(
        @InjectRepository(District)
        private districtsRepository: Repository<District>,
        @InjectRepository(MetroStation)
        private metroStationsRepository: Repository<MetroStation>,
    ) { }

    async getDistricts(): Promise<District[]> {
        return this.districtsRepository.find();
    }

    async createDistrict(name: string, city: string = 'Baku'): Promise<District> {
        const district = this.districtsRepository.create({ name, city });
        return this.districtsRepository.save(district);
    }

    async getMetroStations(): Promise<MetroStation[]> {
        return this.metroStationsRepository.find();
    }

    async createMetroStation(name: string, city: string = 'Baku', line?: string): Promise<MetroStation> {
        const station = this.metroStationsRepository.create({ name, city, line });
        return this.metroStationsRepository.save(station);
    }
}
