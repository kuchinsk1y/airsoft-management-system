import { Body, Controller, Get, Put } from '@nestjs/common';
import { User } from '../common/decorators/user.decorator';
import { UpdateMyEquipmentDto } from './dto/update-my-equipment.dto';
import { EquipmentService } from './equipment.service';

@Controller('users/me')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get('equipment')
  async getMyEquipment(@User('userId') userId: number) {
    return this.equipmentService.getMyEquipment(userId);
  }

  @Put('equipment')
  async updateMyEquipment(
    @User('userId') userId: number,
    @Body() dto: UpdateMyEquipmentDto,
  ) {
    return this.equipmentService.updateMyEquipment(userId, dto);
  }
}
