const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Product category is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative']
    },
    oldPrice: {
        type: Number,
        min: [0, 'Old price cannot be negative']
    },
    image: {
        type: String,
        required: [true, 'Product image URL is required']
    },
    color: {
        type: String,
        trim: true
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author/Admin ID is required']
    }
}, {
    timestamps: true 
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;