import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { UsersDataService } from './users-data.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule), StorageModule],
  controllers: [UsersController],
  providers: [UsersService, UsersDataService],
  exports: [UsersService],
})
export class UsersModule {}
