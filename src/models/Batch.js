import mongoose from "mongoose";

/**
 * Batches mirror the frontend JSON shape: arbitrary fields at root (strict: false).
 * `brandId` links to Brand; legacy `id` from exports is stored as `id` for API parity.
 */
const batchSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
      index: true,
    },
  },
  { strict: false, timestamps: false }
);

batchSchema.index({ brandId: 1, id: 1 }, { unique: true, sparse: true });

export const Batch = mongoose.model("Batch", batchSchema);
