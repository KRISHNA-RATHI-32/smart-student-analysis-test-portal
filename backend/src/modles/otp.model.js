import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Auto-delete after 5 minutes (TTL index)
  }
});

export const Otp = mongoose.model("Otp", otpSchema);
