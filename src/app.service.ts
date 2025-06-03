import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      status: 'success',
      message: 'Bienvenido a la API de Modas Nansi',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
  }
}
