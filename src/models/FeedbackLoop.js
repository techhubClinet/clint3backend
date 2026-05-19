import mongoose from "mongoose";

const feedbackLoopSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
      index: true,
    },
    batchId: { type: String, default: "" },
    videoLink: { type: String, default: "" },
    imageData: { type: String, default: "" },
    hypothesisWhy: { type: String, default: "" },
    actionPlan: { type: String, default: "" },
    completed: { type: Boolean, default: false },
    createdAt: { type: String, default: "" },
    id: { type: String, required: true },
  },
  { strict: false, timestamps: false }
);

feedbackLoopSchema.index({ brandId: 1, id: 1 }, { unique: true });

export const FeedbackLoop = mongoose.model("FeedbackLoop", feedbackLoopSchema);
