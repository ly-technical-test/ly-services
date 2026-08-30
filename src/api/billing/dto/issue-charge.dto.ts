import { IsNotEmpty, IsInt, IsString, IsIn, Min, MaxLength, IsMongoId } from 'class-validator';

export class IssueChargeDto {
  @IsNotEmpty({ message: 'invalid_customer_id' })
  @IsMongoId({ message: 'invalid_customer_id' })
  customerId: string;

  @IsNotEmpty({ message: 'invalid_amount' })
  @IsInt({ message: 'invalid_amount' })
  @Min(200, { message: 'invalid_amount' })
  amount: number;

  @IsNotEmpty({ message: 'invalid_description' })
  @IsString({ message: 'invalid_description' })
  @MaxLength(255, { message: 'invalid_description' })
  description: string;

  @IsNotEmpty({ message: 'invalid_payment_method' })
  @IsString({ message: 'invalid_payment_method' })
  @IsIn(['pix', 'boleto', 'cartao', 'all'], { message: 'invalid_payment_method' })
  @MaxLength(20, { message: 'invalid_payment_method' })
  payment_method: string;
}
