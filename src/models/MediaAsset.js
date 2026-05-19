import mongoose from "mongoose";

const mediaAssetSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      index: true,
    },
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    resourceType: { type: String, enum: ["image", "video", "raw", "auto"] },
    bytes: { type: Number },
    originalFilename: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const MediaAsset = mongoose.model("MediaAsset", mediaAssetSchema);
