require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const app = express();
const paymentMethodRoutes = require('./routes/paymentMethod.routes');

// Middleware
app.use(cors()); // Allows cross-origin requests
app.use(express.json()); // Parses incoming JSON requests

// Routes
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const planRoutes = require('./routes/plan.routes'); 
const zoneRoutes = require('./routes/zone.routes');
const billingRoutes = require('./routes/billing.routes');
const paymentRoutes = require('./routes/payment.routes');


app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/plans', planRoutes); 
app.use('/api/zones', zoneRoutes); 
app.use('/api/billing', billingRoutes); 
app.use('/api/payments', paymentRoutes);
app.use('/api/payment-methods', paymentMethodRoutes); 

// Schedule the invoice generation to run once every day at 1 AM
// Cron format: 'minute hour day-of-month month day-of-week'
cron.schedule('0 1 * * *', () => {
  console.log('---------------------');
  generateRenewalInvoices();
  console.log('---------------------');
}, {
  scheduled: true,
  timezone: "Asia/Kolkata" // Set to your timezone
});

app.get('/', (req, res) => {
  res.send('ISP Management Platform API is running...');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});