import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type TemplateDocument = HydratedDocument<Template>;

export interface TemplateSeoConfig {
  browserTitle?: string;
  ruBrowserTitle?: string;
  metaDescription?: string;
  ruMetaDescription?: string;
  ogImage?: string;
  index?: boolean;
  follow?: boolean;
  includeSitemap?: boolean;
  canonicalUrl?: string;
  seoText?: string;
}

export type TemplatePageConfig = Record<string, unknown> & {
  seo?: TemplateSeoConfig;
};

@Schema({ timestamps: true, versionKey: false })
export class Template {
  @Prop({ required: true, unique: true })
  pageKey: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  config: TemplatePageConfig;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
