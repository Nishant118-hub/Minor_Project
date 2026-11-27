import User from '../models/User.js';

export async function ensureBootstrapAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new Error('Set a valid BOOTSTRAP_ADMIN_EMAIL and a BOOTSTRAP_ADMIN_PASSWORD of 8 to 128 characters.');
  }

  const admin = await User.findOne({ email });
  if (admin && admin.role !== 'ADMIN') {
    throw new Error('The configured bootstrap admin email is already used by a non-admin account.');
  }

  if (!admin) {
    await User.create({
      name: 'Platform Administrator',
      email,
      password,
      role: 'ADMIN'
    });
  }

  if (email !== 'admin@cyber.local') {
    await User.updateOne(
      { email: 'admin@cyber.local', role: 'ADMIN' },
      { $set: { isActive: false } }
    );
  }

  return admin;
}
