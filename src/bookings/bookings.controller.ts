import { Controller, Get, Post, Patch, Body, Query, Param } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Post()
    create(@Body() createBookingDto: CreateBookingDto) {
        return this.bookingsService.create(createBookingDto);
    }

    @Get()
    findByStadium(@Query('stadiumId') stadiumId: string, @Query('date') date: string) {
        return this.bookingsService.findByStadium(stadiumId, date);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.bookingsService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.bookingsService.updateStatus(id, status);
    }

    @Patch(':id/players')
    updatePlayers(@Param('id') id: string, @Body('currentPlayers') currentPlayers: number) {
        return this.bookingsService.updatePlayerCount(id, currentPlayers);
    }
}
