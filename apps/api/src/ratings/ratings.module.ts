import { Module, forwardRef } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RatingsController } from './ratings.controller';
import { RatingsDataService } from './ratings-data.service';
import { EventResultsService } from './event-results.service';
import { OrganizerRatingsService } from './organizer-ratings.service';
import { PlayerRatingsService } from './player-ratings.service';
import { TeamRatingsService } from './team-ratings.service';

@Module({
  imports: [PrismaModule, forwardRef(() => EventsModule)],
  controllers: [RatingsController],
  providers: [
    RatingsDataService,
    EventResultsService,
    OrganizerRatingsService,
    PlayerRatingsService,
    TeamRatingsService,
  ],
  exports: [
    RatingsDataService,
    EventResultsService,
    OrganizerRatingsService,
    PlayerRatingsService,
    TeamRatingsService,
  ],
})
export class RatingsModule {}
