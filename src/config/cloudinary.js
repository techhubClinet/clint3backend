import { v2 as cloudinary } from "cloudinary";
import { settings } from "./settings.js";

export function configureCloudinary() {
  const { cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret } =
    settings;
  if (cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret) {
    cloudinary.config({
      cloud_name: cloudinaryCloudName,
      api_key: cloudinaryApiKey,
      api_secret: cloudinaryApiSecret,
    });
    return true;
  }
  return false;
}

export function isCloudinaryConfigured() {
  return !!(
    settings.cloudinaryCloudName &&
    settings.cloudinaryApiKey &&
    settings.cloudinaryApiSecret
  );
}
