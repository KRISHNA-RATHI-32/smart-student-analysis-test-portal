import "dotenv/config";
import mongoose from "mongoose";
import { User } from "./modles/user.model.js";
import { DB_NAME } from "./constants.js";

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@examiq.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const fullName = process.env.ADMIN_FULLNAME || "Admin";
  const username = process.env.ADMIN_USERNAME || "admin";

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
