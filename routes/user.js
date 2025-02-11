const express = require('express');
const router = express.Router();
const orderController = require('../controllers/user/orderController');



router.post('/update-payment-status', orderController.updatePaymentStatus);

// ...existing code...

module.exports = router;
