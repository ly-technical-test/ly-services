import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true, maxlength: 128 })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, maxlength: 254 })
  email: string;

  @Prop({ required: true, maxlength: 255 })
  passwordHash: string;

}

export const UserSchema = SchemaFactory.createForClass(User);
