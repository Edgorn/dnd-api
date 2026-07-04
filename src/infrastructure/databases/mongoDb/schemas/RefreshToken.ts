import mongoose, { Schema, Document, Types } from "mongoose";

export interface RefreshTokenDocument extends Document {
  token: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  revoked: boolean;
}

const refreshTokenSchema: Schema = new Schema<RefreshTokenDocument>({
  token: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false },
}, { timestamps: true });

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshTokenModel = mongoose.model<RefreshTokenDocument>("RefreshToken", refreshTokenSchema);
export default RefreshTokenModel;
