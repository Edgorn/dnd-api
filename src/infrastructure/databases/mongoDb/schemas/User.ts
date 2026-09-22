import mongoose, { Schema, Document, Types } from "mongoose";

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  password: string;
  accessibleSystems: string[];
  isAdmin?: boolean;
  deletedAt?: Date | null;
}

const userSchema: Schema = new Schema<UserDocument>({
  name: {
    type: String,
    required: [true, "El nombre es obligatorio"],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, "La contraseña es obligatoria"]
  },
  accessibleSystems: [String],
  isAdmin: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  collection: 'users',
  timestamps: true
});

const UserModel = mongoose.model<UserDocument>("User", userSchema);
export default UserModel;
