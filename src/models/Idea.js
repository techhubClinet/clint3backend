import mongoose from "mongoose";

const ideaSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
      index: true,
    },
    date: { type: String, default: "" },
    idea: { type: String, default: "" },
    inspo: { type: String, default: "" },
    status: { type: String, default: "Pending" },
    id: { type: String, required: true },
  },
  { strict: false, timestamps: false }
);

ideaSchema.index({ brandId: 1, id: 1 }, { unique: true });

export const Idea = mongoose.model("Idea", ideaSchema);
