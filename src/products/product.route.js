const express = require('express');
const { 
    createNewProduct, 
    getAllProducts, 
    getSingleProduct, 
    updateProductById, 
    deleteProductById 
} = require('./product.controller');

const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');
const router = express.Router();

// ১. Create a product (🛠️ ফিক্স: এখন শুধুমাত্র অ্যাডমিনরাই প্রোডাক্ট তৈরি করতে পারবে)
router.post('/create-product', verifyToken, verifyAdmin, createNewProduct);

// ২. Get all products (পাবলিক রাউট - সবাই দেখতে পারবে)
router.get("/", getAllProducts);

// ৩. Get single product (পাবলিক রাউট - সবাই দেখতে পারবে)
router.get("/:id", getSingleProduct);

// ৪. Update product (প্রোটেক্টেড রাউট - শুধুমাত্র অ্যাডমিন)
router.patch('/update-product/:id', verifyToken, verifyAdmin, updateProductById);

// ৫. Delete product (প্রোটেক্টেড রাউট - শুধুমাত্র অ্যাডমিন)
router.delete("/:id", verifyToken, verifyAdmin, deleteProductById);

module.exports = router;