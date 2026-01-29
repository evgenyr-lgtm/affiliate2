import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';
import { AffiliateStatus, PaymentTerm, RateType } from '@prisma/client';

export class UpdateAffiliateAdminDto {
  @ApiPropertyOptional({ enum: AffiliateStatus })
  @IsEnum(AffiliateStatus)
  @IsOptional()
  status?: AffiliateStatus;

  @ApiPropertyOptional({ enum: PaymentTerm })
  @IsEnum(PaymentTerm)
  @IsOptional()
  paymentTerm?: PaymentTerm;

  @ApiPropertyOptional({ enum: RateType })
  @IsEnum(RateType)
  @IsOptional()
  rateType?: RateType;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  rateValue?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;
}
