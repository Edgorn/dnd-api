import mongoose, { Schema, Document, Types } from "mongoose";

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  password: string;
  accessibleSystems: string[];
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
  accessibleSystems: [String]
}, {
  collection: 'users',
  timestamps: true
});

const UserModel = mongoose.model<UserDocument>("User", userSchema);
export default UserModel;