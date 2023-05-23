import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PDFFileDocument = HydratedDocument<PDFFile>;

@Schema()
export class PDFFile {
  @Prop() originalname: string;
  @Prop() size: number;
}

export const PDFFileSchema = SchemaFactory.createForClass(PDFFile);