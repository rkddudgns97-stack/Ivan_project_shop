import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { CloudinaryService } from './cloudinary.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, CloudinaryService],
})
export class AdminModule {}
