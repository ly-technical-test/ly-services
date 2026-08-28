import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'invalid_email' })
  @IsEmail({}, { message: 'invalid_email' })
  email: string;

  @IsNotEmpty({ message: 'invalid_password' })
  @IsString({ message: 'invalid_password' })
  password: string;
}

