import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'invalid_name' })
  @IsString({ message: 'invalid_name' })
  name: string;

  @IsNotEmpty({ message: 'invalid_email' })
  @IsEmail({}, { message: 'invalid_email' })
  email: string;

  @IsNotEmpty({ message: 'invalid_password' })
  @IsString({ message: 'invalid_password' })
  @MinLength(8, { message: 'invalid_password' })
  password: string;
}

