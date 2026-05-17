import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ImageFileInterceptor } from '../common/config/file-upload.config';
import { Admin } from '../common/decorators/admin.decorator';
import { User } from '../common/decorators/user.decorator';
import { UsersResponseDto } from './dto/users-response.dto';
import { UsersUpdateRequestDto } from './dto/users-update-request.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async get(@User('userId') userId: number) {
    const user = await this.usersService.getUser({ id: userId });
    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }
    return new UsersResponseDto(user);
  }

  @Get('search')
  async search(@Query('nickName') nickName: string | undefined) {
    const users = await this.usersService.searchByNickName(nickName ?? '', 20);
    return users.map((user) => new UsersResponseDto(user));
  }

  @Get('count')
  @Admin()
  async getCount(): Promise<{ count: number }> {
    const count = await this.usersService.countUsers();
    return { count };
  }

  @Get('all')
  @Admin()
  async getAll(
    @Query('email') email?: string,
    @Query('nickName') nickName?: string,
    @Query('isVerified') isVerified?: string,
  ) {
    const users = await this.usersService.getUsers({
      email,
      nickName,
      isVerified: isVerified !== undefined ? isVerified === 'true' : undefined,
    });
    return users.map((user) => new UsersResponseDto(user));
  }

  @Patch()
  async update(
    @Body() dto: UsersUpdateRequestDto,
    @User('userId') userId: number,
  ) {
    const updatedUser = await this.usersService.updateUser(userId, dto);
    return new UsersResponseDto(updatedUser);
  }

  @Post('upload-avatar')
  @UseInterceptors(ImageFileInterceptor)
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @User('userId') userId: number,
  ) {
    const result = await this.usersService.uploadAvatar(userId, file);
    return {
      url: result.url,
      user: new UsersResponseDto(result.user),
    };
  }
}
