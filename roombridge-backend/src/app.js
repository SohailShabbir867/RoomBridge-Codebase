const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./middleware/error.middleware');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const listingRoutes = require('./routes/listing.routes');
const bookingRoutes = require('./routes/booking.routes');
const messageRoutes = require('./routes/message.routes');
const preferenceRoutes = require('./routes/preference.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('RoomBridge API is running...');
});

app.use(errorHandler);

module.exports = app;
