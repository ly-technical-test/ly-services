import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'invalid_name' })
  @IsString({ message: 'invalid_name' })
  @MaxLength(128, { message: 'invalid_name' })
  name: string;

  @IsNotEmpty({ message: 'invalid_email' })
  @IsEmail({}, { message: 'invalid_email' })
  @MaxLength(254, { message: 'invalid_email' })
  email: string;

  @IsNotEmpty({ message: 'invalid_password' })
  @IsString({ message: 'invalid_password' })
  @MinLength(8, { message: 'invalid_password' })
  @MaxLength(64, { message: 'invalid_password' })
  password: string;
}
