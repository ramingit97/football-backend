import { Controller, Get, Post, Patch, Body, Query, Param } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { TelegramService } from '../stadiums/telegram.service';

@Controller('bookings')
export class BookingsController {
    constructor(
        private readonly bookingsService: BookingsService,
        private readonly telegramService: TelegramService,
    ) {}

    @Post()
    async create(@Body() createBookingDto: CreateBookingDto) {
        const booking = await this.bookingsService.create(createBookingDto);
        const { stadiumId, date, startTime, customerName, note } = createBookingDto;
        const noteText = note ? `\n📝 Qeyd: <i>${note}</i>` : '';
        this.telegramService.notifyAdmin(
            `🏟 <b>Yeni sifariş!</b>\n\n` +
            `📅 ${date} — ${startTime}\n` +
            `🆔 Stadion: <code>${stadiumId}</code>\n` +
            `👤 ${customerName || 'Qeydiyyatsız'}${noteText}\n\n` +
            `Booking ID: <code>${booking.id}</code>`,
        ).catch(() => {});
        return booking;
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
