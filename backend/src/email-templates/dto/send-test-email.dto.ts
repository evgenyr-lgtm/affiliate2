import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SendTestEmailDto {
  @IsEmail()
  to: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  body?: string;
}
