import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  title?: string;
  messages: IMessage[];
  model?: string;
  style?: string;
  voiceModel?: string;
  isVoiceConversation: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, { _id: false });

const conversationSchema = new Schema<IConversation>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: { type: String },
  messages: [messageSchema],
  model: { type: String },
  style: { type: String },
  voiceModel: { type: String },
  isVoiceConversation: { type: Boolean, default: false },
  active: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ userId: 1, active: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
