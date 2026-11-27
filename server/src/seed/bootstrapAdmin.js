import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import { ensureBootstrapAdmin } from '../services/bootstrapAdminService.js';

dotenv.config();

async function main() {
  try {
    await connectDatabase();
    await ensureBootstrapAdmin();
    console.log('Bootstrap administrator is ready.');
  } catch (error) {
    console.error('Unable to bootstrap administrator:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
