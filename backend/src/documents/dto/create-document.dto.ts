import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';

export class CreateDocumentDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty()
  @IsString()
  fileUrl: string;
}
