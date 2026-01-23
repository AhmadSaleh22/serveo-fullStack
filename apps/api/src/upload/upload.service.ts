import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private isCloudinaryConfigured: boolean;

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    this.isCloudinaryConfigured = !!(cloudName && apiKey && apiSecret);

    if (this.isCloudinaryConfigured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.');
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 5MB.');
    }

    if (this.isCloudinaryConfigured) {
      return this.uploadToCloudinary(file);
    } else {
      return this.uploadToLocal(file);
    }
  }

  private async uploadToCloudinary(file: Express.Multer.File): Promise<{ url: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'menu-saas',
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error) {
            console.error('Cloudinary upload failed:', error);
            reject(new BadRequestException('Failed to upload image to cloud storage'));
          } else if (result) {
            resolve({ url: result.secure_url });
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  private async uploadToLocal(file: Express.Multer.File): Promise<{ url: string }> {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads');

      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate unique filename with proper extension
      const ext = path.extname(file.originalname) || this.getExtensionFromMime(file.mimetype);
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      const filepath = path.join(uploadDir, filename);

      // Write file
      fs.writeFileSync(filepath, file.buffer);

      // Return local URL (in production, this would be a full URL)
      const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:4000');
      return { url: `${baseUrl}/uploads/${filename}` };
    } catch (error) {
      console.error('Local upload failed:', error);
      throw new BadRequestException('Failed to save image locally');
    }
  }

  private getExtensionFromMime(mimetype: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    return mimeToExt[mimetype] || '.jpg';
  }

  async deleteImage(url: string): Promise<void> {
    if (this.isCloudinaryConfigured && url.includes('cloudinary')) {
      // Extract public ID from URL
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      const publicId = `menu-saas/${filename.split('.')[0]}`;

      try {
        await cloudinary.uploader.destroy(publicId);
      } catch {
        // Ignore deletion errors
      }
    } else if (url.includes('/uploads/')) {
      // Delete local file
      const filename = url.split('/uploads/')[1];
      const filepath = path.join(process.cwd(), 'uploads', filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }
  }
}
