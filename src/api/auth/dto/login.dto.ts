import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'invalid_email' })
  @IsEmail({}, { message: 'invalid_email' })
  @MaxLength(254, { message: 'invalid_email' })
  email: string;

  @IsNotEmpty({ message: 'invalid_password' })
  @IsString({ message: 'invalid_password' })
  @MaxLength(64, { message: 'invalid_password' })
  password: string;
}

