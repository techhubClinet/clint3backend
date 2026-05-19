import mongoose from "mongoose";

const researchDocSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
      index: true,
    },
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    createdAt: { type: String, default: "" },
    updatedAt: { type: String, default: "" },
    id: { type: String, required: true },
  },
  { strict: false, timestamps: false }
);

researchDocSchema.index({ brandId: 1, id: 1 }, { unique: true });

export const ResearchDoc = mongoose.model("ResearchDoc", researchDocSchema);
