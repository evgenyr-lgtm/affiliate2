import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReferralStatus, PaymentStatus } from '@prisma/client';

export class UpdateReferralDto {
  @ApiProperty({ required: false, enum: ReferralStatus })
  @IsOptional()
  @IsEnum(ReferralStatus)
  status?: ReferralStatus;

  @ApiProperty({ required: false, enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
