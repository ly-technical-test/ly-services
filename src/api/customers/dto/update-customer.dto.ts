import { IsOptional, IsString, IsEmail, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateAddressDto {
  @IsOptional()
  @IsString({ message: 'invalid_street' })
  street?: string;

  @IsOptional()
  @IsString({ message: 'invalid_zone' })
  zone?: string;

  @IsOptional()
  @IsString({ message: 'invalid_city' })
  city?: string;

  @IsOptional()
  @IsString({ message: 'invalid_state' })
  state?: string;

  @IsOptional()
  @IsString({ message: 'invalid_zip' })
  zip?: string;

  number?: string;
  complement?: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString({ message: 'invalid_name' })
  @MaxLength(128, { message: 'invalid_name' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'invalid_email' })
  @MaxLength(254, { message: 'invalid_email' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'invalid_cpf_cnpj' })
  @MaxLength(18, { message: 'invalid_cpf_cnpj' })
  cpfCnpj?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  address?: UpdateAddressDto;
}
