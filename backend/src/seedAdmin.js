import "dotenv/config";
import mongoose from "mongoose";
import { User } from "./modles/user.model.js";
import { DB_NAME } from "./constants.js";

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const fullName = process.env.ADMIN_FULLNAME
  const username = process.env.ADMIN_USERNAME
  if (!email || !password || !username) {
    console.error("ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_USERNAME must all be set — refusing to seed with defaults.");
    process.exit(1);
  }

  // 🚨 Enforce password strength
  if (password.length < 12) {
    console.error("ADMIN_PASSWORD is too short — use at least 12 characters.");
    process.exit(1);
  }
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log("Connected to MongoDB");

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`Admin already exists: ${email} (role: ${existing.role})`);
      process.exit(0);
    }

    const admin = await User.create({
      fullName,
      email,
      username,
      password,
      role: "admin",
      isVerified: true
    });

    console.log(`Admin created successfully!`);
    console.log(`   Email:    ${admin.email}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Password: ${password}`);
    console.log(`\n   Use these credentials to login.`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error.message);
    process.exit(1);
  }
}

seedAdmin();
