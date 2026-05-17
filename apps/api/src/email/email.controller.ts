import { Body, Controller, Post } from '@nestjs/common';
import { Admin } from '../common/decorators/admin.decorator';
import { EmailRequestDto } from './dto/email-request.dto';
import { EmailResponseDto } from './dto/email-response.dto';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @Admin()
  async send(@Body() body: EmailRequestDto): Promise<EmailResponseDto> {
    return this.emailService.send(body);
  }
}
