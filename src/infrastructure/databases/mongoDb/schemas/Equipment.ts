import mongoose, { Schema } from "mongoose";
import { EquipmentMongo } from "../../../../domain/types/equipment.types";

const equipmentSchema: Schema = new Schema<EquipmentMongo>(
  {
    ruleset: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, default: "" },
    subcategory: { type: String, default: "" },
    equipSlot: { type: String, default: null },
    description: { type: Schema.Types.Mixed, default: "" },
    cost: {
      quantity: { type: Number, default: 0 },
      unit: { type: Schema.Types.ObjectId, ref: "Coin" }
    },
    weight: { type: Number, default: 0 },
    storageTags: { type: [String], default: [] },
    containerStats: {
      maxWeight: { type: Number },
      maxItems: { type: Number },
      acceptedStorageTags: { type: [String] },
      maxLiquidCapacity: {
        value: { type: Number },
        unit: { type: String }
      },
      maxSolidCapacity: {
        value: { type: Number },
        unit: { type: String }
      }
    },
    bonuses: {
      armor_class: Number,
      saving_throws: Number
    },
    isMagic: { type: Boolean, default: false },
    weapon: { type: Schema.Types.Mixed },
    armor: { type: Schema.Types.Mixed },
    content: [{ id: String, quantity: Number }],
    deletedAt: { type: Date, default: null }
  },
  { collection: "equipments", timestamps: true }
);

equipmentSchema.index({ name: 1, ruleset: 1 });
equipmentSchema.index({ ruleset: 1, deletedAt: 1 });

const EquipmentModel = mongoose.model<EquipmentMongo>("equipments", equipmentSchema);
export default EquipmentModel;
