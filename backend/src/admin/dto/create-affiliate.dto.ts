import { IsEmail, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';

export class CreateAffiliateDto {
  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsString()
  password: string;
}
