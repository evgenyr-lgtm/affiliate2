import { IsEmail, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';

export class CreateManualReferralDto {
  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  accountType: AccountType;

  // Individual fields
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
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contractDuration?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  workCountry?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  maritalStatus?: string;

  // Company fields
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contactFirstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contactLastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  linkedin?: string;

  // Common
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
