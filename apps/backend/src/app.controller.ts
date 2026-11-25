import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: 'Delivery Lakay API',
      timestamp: new Date().toISOString(),
      city: 'Cap-Haïtien',
      uptime: process.uptime(),
    };
  }

  @Get('ping')
  ping() {
    return { pong: true, time: Date.now() };
  }
}
