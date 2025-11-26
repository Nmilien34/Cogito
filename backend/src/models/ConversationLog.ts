import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationLog extends Document {
  deviceId: string;
  summary: string;
  concerns: string[];
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationLogSchema = new Schema<IConversationLog>({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  summary: {
    type: String,
    required: true
  },
  concerns: [{
    type: String
  }],
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(_doc: any, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
conversationLogSchema.index({ deviceId: 1, timestamp: -1 });

export const ConversationLog = mongoose.model<IConversationLog>('ConversationLog', conversationLogSchema);
