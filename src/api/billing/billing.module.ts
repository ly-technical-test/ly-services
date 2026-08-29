import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { Charge, ChargeSchema } from './schemas/charge.schema.js';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema.js';
import { UsersModule } from '../users/users.module.js';
import { LytexApiService } from './services/lytex-api.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Charge.name, schema: ChargeSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
  ],
  controllers: [BillingController],
  providers: [BillingService, LytexApiService],
  exports: [BillingService, LytexApiService],
})
export class BillingApiModule {}
