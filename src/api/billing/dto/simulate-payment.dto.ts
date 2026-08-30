import { IsNotEmpty, IsString, IsIn, MaxLength } from 'class-validator';

export class SimulatePaymentDto {
  @IsNotEmpty({ message: 'invalid_payment_method' })
  @IsString({ message: 'invalid_payment_method' })
  @IsIn(['pix', 'boleto', 'creditCard'], { message: 'invalid_payment_method' })
  @MaxLength(20, { message: 'invalid_payment_method' })
  paymentMethod: string;
}
