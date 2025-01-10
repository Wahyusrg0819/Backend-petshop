const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');

// Import route files
const loginRoute = require('./routes/login');
const profileRoute = require('./routes/profile');
const registerRoute = require('./routes/register');
const usersRoute = require('./routes/users');
const uploadPictRoute = require('./routes/uploadpict');
const cartRoute = require('./routes/cart');
const productRoute = require('./routes/product');
const passwordRoute = require('./routes/password');
const emailRoute = require('./routes/email');
const petOrdersRoute = require('./routes/petOrders');
const ordersRoute = require('./routes/orders');
const petCategoriesRoute = require('./routes/petCategories');
const favoritesRoute = require('./routes/favorites');
const notificationRoutes = require('./routes/notifications');
const petBoardingRoutes = require('./routes/pet-boarding');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

console.log('Server is about to register routes...');

// Logging middleware
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});

// Register routes
app.use('/api', loginRoute);
app.use('/api', profileRoute);
app.use('/api', registerRoute);
app.use('/api', usersRoute);
app.use('/api', uploadPictRoute);
app.use('/api', cartRoute);
app.use('/api', productRoute);
app.use('/api', passwordRoute);
app.use('/api', emailRoute);

// Specific routes
app.use('/api/pet-orders', petOrdersRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/pet-categories', petCategoriesRoute);
app.use('/api/favorites', favoritesRoute);
app.use('/api/notifications', notificationRoutes);
app.use('/api/pet-boarding', petBoardingRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
