import { Controller, Get, Put, Post, Body, Param, UseInterceptors, UploadedFile, Req, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { PlatformSettingsService } from './platform-settings.service';

@Controller('api/v1/platform-settings')
export class PlatformSettingsController {
  constructor(private readonly settingsService: PlatformSettingsService) {}

  @Get()
  async getAll() {
    const data = await this.settingsService.getAll();
    return {
      success: true,
      data,
    };
  }

  @Get('category/:cat')
  async getByCategory(@Param('cat') cat: string) {
    const data = await this.settingsService.getByCategory(cat);
    return {
      success: true,
      data,
    };
  }

  @Put()
  async updateBulk(@Body() updates: Record<string, any>) {
    const data = await this.settingsService.updateBulk(updates);
    return {
      success: true,
      message: 'Paramètres mis à jour avec succès',
      data,
    };
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(16)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: any, @Req() req: any) {
    const host = req?.get ? req.get('host') : 'localhost:4000';
    const protocol = req?.protocol || 'http';
    const fileUrl = `${protocol}://${host}/uploads/${file.filename}`;
    return {
      success: true,
      url: fileUrl,
      relativeUrl: `/uploads/${file.filename}`,
      filename: file.filename,
    };
  }

  @Get('uploads/:filename')
  async serveFile(@Param('filename') filename: string, @Res() res: any) {
    const filePath = join(process.cwd(), 'uploads', filename);
    return res.sendFile(filePath);
  }
}

