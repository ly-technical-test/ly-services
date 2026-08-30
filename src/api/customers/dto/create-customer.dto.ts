import { IsNotEmpty, IsString, IsEmail, MaxLength, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsNotEmpty({ message: 'invalid_street' })
  @IsString({ message: 'invalid_street' })
  street: string;

  @IsNotEmpty({ message: 'invalid_zone' })
  @IsString({ message: 'invalid_zone' })
  zone: string;

  @IsNotEmpty({ message: 'invalid_city' })
  @IsString({ message: 'invalid_city' })
  city: string;

  @IsNotEmpty({ message: 'invalid_state' })
  @IsString({ message: 'invalid_state' })
  state: string;

  @IsNotEmpty({ message: 'invalid_zip' })
  @IsString({ message: 'invalid_zip' })
  zip: string;

  @IsOptional()
  @IsString({ message: 'invalid_number' })
  number?: string;

  @IsOptional()
  @IsString({ message: 'invalid_complement' })
  complement?: string;
}

export class CreateCustomerDto {
  @IsNotEmpty({ message: 'invalid_name' })
  @IsString({ message: 'invalid_name' })
  @MaxLength(128, { message: 'invalid_name' })
  name: string;

  @IsNotEmpty({ message: 'invalid_email' })
  @IsEmail({}, { message: 'invalid_email' })
  @MaxLength(254, { message: 'invalid_email' })
  email: string;

  @IsNotEmpty({ message: 'invalid_cpf_cnpj' })
  @IsString({ message: 'invalid_cpf_cnpj' })
  @MaxLength(18, { message: 'invalid_cpf_cnpj' })
  cpfCnpj: string;

  @IsNotEmpty({ message: 'invalid_address' })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
