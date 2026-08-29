import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Charge extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true })
  customer: mongoose.Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, maxlength: 255 })
  description: string;

  @Prop({ required: true, maxlength: 20 })
  paymentMethod: string;

  @Prop({ required: true, maxlength: 20 })
  status: string;

  @Prop({ required: true, maxlength: 255 })
  lytexId: string;

  @Prop({ required: true, maxlength: 255 })
  lytexHashId: string;

  @Prop({ required: false, maxlength: 255 })
  cardToken?: string;

  @Prop({ required: false, maxlength: 255 })
  cardValidUntil?: string;

  @Prop({ required: false, maxlength: 255 })
  cardStatus?: string;

  @Prop({ required: false, maxlength: 50 })
  cardMethod?: string;
}

export const ChargeSchema = SchemaFactory.createForClass(Charge);
