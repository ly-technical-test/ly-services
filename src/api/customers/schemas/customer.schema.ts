import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Customer extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 128 })
  name: string;

  @Prop({ required: true, trim: true, maxlength: 18 })
  cpfCnpj: string;

  @Prop({ required: true, lowercase: true, trim: true, maxlength: 254 })
  email: string;

  @Prop({ type: Object, required: true })
  address: {
    street: string;
    zone: string;
    city: string;
    state: string;
    number?: string;
    complement?: string;
    zip: string;
  };

  @Prop({ required: true, trim: true })
  lytexClientId: string;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
