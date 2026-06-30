
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PresentationDocument = Presentation & Document;
export type ContentStatus = 'pending' | 'approved' | 'suspended';

class Slide {
  @Prop({ required: true })
  slideNumber: number;

  @Prop({ required: true })
  title: string;

  // Layout: 'standard' | 'dashboard' | 'comparison' | 'grid'
  @Prop({ default: 'standard' })
  layout: string;

  // Standard bullet points (backward compatibility)
  @Prop({ type: [String], default: [] })
  bulletPoints: string[];

  // Rich Content for complex layouts
  @Prop({ type: Object, default: {} })
  content: {
    // For Dashboard:
    keyConcept?: string;
    formula?: string;
    chartTitle?: string;
    chartData?: { label: string; value: number }[];
    
    // For Comparison:
    leftTitle?: string;
    rightTitle?: string;
    comparisonItems?: { feature: string; left: string; right: string }[];
    
    // For Grid:
    gridItems?: { title: string; description: string; icon?: string }[];
  };

  @Prop()
  accentColor?: string;
}

@Schema({ timestamps: true })
export class Presentation {
  @Prop({ required: true })
  grade: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  unit: string;

  @Prop({ type: [Object], required: true }) // Using [Object] or specific Slide class if simple
  slides: Slide[];

  // Content moderation status
  @Prop({ 
    required: true, 
    enum: ['pending', 'approved', 'suspended'],
    default: 'pending',
    index: true 
  })
  status: ContentStatus;

  // Review metadata
  @Prop()
  reviewerComment?: string;

  @Prop()
  reviewedBy?: string;

  @Prop()
  reviewedAt?: Date;
}

export const PresentationSchema = SchemaFactory.createForClass(Presentation);

// Index for unique retrieval
PresentationSchema.index({ grade: 1, subject: 1, unit: 1 }, { unique: true });

