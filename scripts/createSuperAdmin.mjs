// Seeds (or promotes) a SUPER_ADMIN user in MongoDB.
// Usage: node scripts/createSuperAdmin.mjs
// Optional env vars: SUPERADMIN_EMAIL, SUPERADMIN_NAME, SUPERADMIN_PASSWORD

import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { MongoClient } from "mongodb";

import User from "../lib/models/User.model.js";
import { generatePassword } from "../lib/password.js";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function ensureDatabase(uri) {
  const dbName = new URL(uri.replace("mongodb://", "http://").replace("mongodb+srv://", "http://")).pathname.replace(/^\//, "") || undefined;

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const admin = client.db().admin();
    const { databases } = await admin.listDatabases();
    const exists = databases.some((db) => db.name === dbName);

    if (exists) {
      console.log(`[db] Database "${dbName}" already exists.`);
    } else {
      console.log(`[db] Database "${dbName}" does not exist yet — it will be created on first write.`);
    }
  } catch (err) {
    console.warn(`[db] Could not check database list (${err.message}). Continuing — MongoDB creates the database automatically on first write.`);
  } finally {
    await client.close();
  }
}

async function main() {
  loadEnvLocal();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set (checked process.env and .env.local)");
  }

  await ensureDatabase(uri);

  await mongoose.connect(uri, { bufferCommands: false });
  console.log("[db] Connected via Mongoose.");

  const email = (process.env.SUPERADMIN_EMAIL || "admin@haldiaguesthouse.com").toLowerCase();
  const name = process.env.SUPERADMIN_NAME || "Super Admin";
  const providedPassword = process.env.SUPERADMIN_PASSWORD;
  const password = providedPassword || generatePassword(12);

  let existing = await User.findOne({ email });

  if (existing) {
    existing.name = name;
    existing.role = "SUPER_ADMIN";
    existing.isActive = true;
    if (providedPassword) existing.password = providedPassword;
    await existing.save();
    console.log(`[superadmin] Existing user "${email}" promoted to SUPER_ADMIN and reactivated.`);
  } else {
    await User.create({
      name,
      email,
      password,
      role: "SUPER_ADMIN",
      isActive: true,
    });
    console.log(`[superadmin] Created SUPER_ADMIN user.`);
    console.log(`  Email:    ${email}`);
    if (!providedPassword) {
      console.log(`  Password: ${password}  (generated — save this, it will not be shown again)`);
    }
  }

  await mongoose.disconnect();
  console.log("[db] Disconnected. Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[createSuperAdmin] Failed:", err.message);
    process.exit(1);
  });
