import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CreateManualReferralDto } from './create-manual-referral.dto';

export class CreateAdminReferralDto extends CreateManualReferralDto {
  @ApiProperty()
  @IsString()
  affiliateId: string;
}
