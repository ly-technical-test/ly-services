import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersController } from './customers.controller.js';
import { CustomersService } from './customers.service.js';
import { Customer, CustomerSchema } from './schemas/customer.schema.js';
import { BillingApiModule } from '../billing/billing.module.js';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
    BillingApiModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
