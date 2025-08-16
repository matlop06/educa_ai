const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config({ path: __dirname + '/.env' });

const setupSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@educa.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'password123';
    const name = 'Super Admin';

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('La cuenta de super-admin ya existe. Se eliminará y se creará de nuevo.');
      await User.deleteOne({ email });
    }

    const newAdmin = new User({
      name,
      email,
      password: password,
      role: 'super-admin',
    });

    await newAdmin.save();
    console.log('Cuenta de super-admin creada con éxito.');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    console.error('Error al configurar la cuenta de super-admin:', error);
  } finally {
    mongoose.disconnect();
  }
};

setupSuperAdmin();
