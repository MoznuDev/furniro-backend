const express = require('express');
const { makePaymentRequest, confirmPayment, getOrdersByEmail, getOrdersByOrdersId, getAllOrders, updateOrderStatus, deleteOrderById, createOrder } = require('./order.controller');

const router = express.Router();

router.post('/create-order', createOrder);

// create checkout session 
router.post('/create-checkout-session', makePaymentRequest);

// confirm payment session 
router.post("/confirm-payment", confirmPayment);

// get orders by email address 
router.get('/:email', getOrdersByEmail);

// get orders by ordersId 
router.get('/order/:id', getOrdersByOrdersId);

// get all orders 
router.get('/', getAllOrders);

// update order status(admin only) 
router.patch("/update-order-status/:id", updateOrderStatus);

// delete order (admin only) 
router.delete("/delete-order/:id", deleteOrderById)

module.exports = router;