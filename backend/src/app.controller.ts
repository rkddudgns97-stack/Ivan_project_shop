import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      success: true,
      data: {
        status: 'ok',
        service: 'welfare-mall-backend',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
