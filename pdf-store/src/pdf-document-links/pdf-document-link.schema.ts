import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PDFDocumentLinkDocument = HydratedDocument<PDFDocumentLink>;

@Schema()
export class PDFDocumentLink {
  @Prop() user_id: string;
  @Prop() pdf_doc_id: string;

  @Prop() archived: boolean;
  @Prop() published: boolean;
  @Prop() delegated: boolean;
  @Prop() delegated_to_url: string;
  @Prop() title: string;
  @Prop({ type: Object }) configs: any;
  @Prop() created_at: string;

  // // --- features
  // @Prop() log_interactions: boolean;
  // @Prop() highlight: boolean;
  // @Prop() underline: boolean;
  // @Prop() linethrough: boolean;
  // @Prop() redact: boolean;
  // @Prop() notes: boolean;
  // @Prop() freeform: boolean;
  // @Prop() embed_resource: boolean;
  // // --- interaction logger
  // @Prop() document_events: [string];
  // @Prop() pdfjs_events: [string];
  // @Prop() mousemove_log_delay: number;
  // @Prop() scroll_log_delay: number;
  // @Prop() resize_log_delay: number;
  // // --- annotation
  // @Prop() annotation_colors: string;
  // // --- freeform
  // @Prop() freeform_stroke_sizes: string;
  // @Prop() freeform_colors: string;
  // // --- advanced features (apis)
  // @Prop() annotation_api: string;
  // @Prop() interaction_logger_api: string;
  // // --- 
  // @Prop() authorized_accounts: string;
  // @Prop() custom_plugins: string;
}

export const PDFDocumentLinkSchema = SchemaFactory.createForClass(PDFDocumentLink);