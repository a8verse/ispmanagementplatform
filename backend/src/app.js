// backend/src/app.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes imports
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const planRoutes = require('./routes/plan.routes');
const zoneRoutes = require('./routes/zone.routes');
const billingRoutes = require('./routes/billing.routes');
const paymentRoutes = require('./routes/payment.routes');
const paymentMethodRoutes = require('./routes/paymentMethod.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const userRoutes = require('./routes/user.routes');     // NEW IMPORT
const roleRoutes = require('./routes/role.routes');     // NEW IMPORT

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/users', userRoutes);                 // NEW: Mount user routes
app.use('/api/roles', roleRoutes);                 // NEW: Mount role routes


// Import the billing service function for cron job
const { generateRenewalInvoices } = require('./services/billing.service');

// Schedule the invoice generation to run once every day at 1 AM
cron.schedule('0 1 * * *', () => {
  console.log('--- Running daily check for renewal invoices ---');
  generateRenewalInvoices();
  console.log('--- Daily renewal check finished ---');
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

app.get('/', (req, res) => {
  res.send('ISP Management Platform API is running...');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});