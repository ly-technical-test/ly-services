import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class PayCardDto {
  @IsNotEmpty({ message: 'invalid_charge_id' })
  @IsString({ message: 'invalid_charge_id' })
  @MaxLength(64, { message: 'invalid_charge_id' })
  chargeId: string;

  @IsNotEmpty({ message: 'invalid_card_number' })
  @IsString({ message: 'invalid_card_number' })
  @MaxLength(20, { message: 'invalid_card_number' })
  cardNumber: string;

  @IsNotEmpty({ message: 'invalid_holder' })
  @IsString({ message: 'invalid_holder' })
  @MaxLength(128, { message: 'invalid_holder' })
  holder: string;

  @IsNotEmpty({ message: 'invalid_expiry' })
  @IsString({ message: 'invalid_expiry' })
  @MaxLength(7, { message: 'invalid_expiry' })
  expiry: string;

  @IsNotEmpty({ message: 'invalid_cvc' })
  @IsString({ message: 'invalid_cvc' })
  @MaxLength(4, { message: 'invalid_cvc' })
  cvc: string;

  @IsOptional()
  @IsString({ message: 'invalid_payment_method' })
  @IsIn(['creditCard'], { message: 'invalid_payment_method' })
  @MaxLength(20, { message: 'invalid_payment_method' })
  method?: string;
}
