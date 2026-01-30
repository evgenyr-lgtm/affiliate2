import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { Storage } from '@google-cloud/storage';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

const getBucketName = () => {
  if (process.env.GCS_BUCKET) return process.env.GCS_BUCKET;
  if (process.env.FIREBASE_STORAGE_BUCKET) return process.env.FIREBASE_STORAGE_BUCKET;
  if (process.env.GOOGLE_CLOUD_PROJECT) return `${process.env.GOOGLE_CLOUD_PROJECT}.appspot.com`;
  return undefined;
};

@Controller('avatars')
export class UploadsController {
  @Get(':filename')
  async getAvatar(@Param('filename') filename: string, @Res() res: Response) {
    const localPath = join(process.cwd(), 'uploads', 'avatars', filename);
    if (existsSync(localPath)) {
      return createReadStream(localPath).pipe(res);
    }

    const bucket = getBucketName();
    if (bucket) {
      const storage = new Storage();
      const file = storage.bucket(bucket).file(`avatars/${filename}`);
      const [exists] = await file.exists();
      if (exists) {
        const stream = file.createReadStream();
        stream.on('error', () => {
          res.status(404).json({ message: 'File not found' });
        });
        stream.pipe(res);
        return;
      }
    }

    return res.status(404).json({ message: 'File not found' });
  }
}
