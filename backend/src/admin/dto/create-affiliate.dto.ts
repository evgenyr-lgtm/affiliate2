import { IsEmail, IsString, IsEnum, IsOptional, IsNumber, Min, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountType, AffiliateStatus, PaymentTerm, RateType } from '@prisma/client';

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty({ enum: AffiliateStatus, required: false })
  @IsEnum(AffiliateStatus)
  @IsOptional()
  status?: AffiliateStatus;

  @ApiProperty({ enum: PaymentTerm, required: false })
  @IsEnum(PaymentTerm)
  @IsOptional()
  paymentTerm?: PaymentTerm;

  @ApiProperty({ enum: RateType, required: false })
  @IsEnum(RateType)
  @IsOptional()
  rateType?: RateType;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  rateValue?: number;

  @ApiProperty({ example: 'USD', required: false })
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  @IsOptional()
  currency?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiProperty()
  @IsString()
  password: string;
}
