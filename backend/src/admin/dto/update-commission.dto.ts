import { IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RateType, PaymentTerm } from '@prisma/client';

export class UpdateCommissionDto {
  @ApiProperty({ enum: RateType })
  @IsEnum(RateType)
  rateType: RateType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  rateValue: number;

  @ApiProperty({ enum: PaymentTerm })
  @IsEnum(PaymentTerm)
  paymentTerm: PaymentTerm;
}
