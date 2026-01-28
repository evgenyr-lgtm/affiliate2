import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAffiliateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  notifySystem?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  notifyMarketing?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}
