const products = require("./product.model");
const reviewsModel = require("../reviews/review.model"); 
const { errorResponse, successResponse } = require("../utilis/responsHandler");

//  Create New Product 
// Create New Product 
const createNewProduct = async (req, res) => {
    try {
        // যদি একসঙ্গে একাধিক প্রোডাক্ট (Bulk Insert) পাঠানো হয়
        if (Array.isArray(req.body)) {
            // প্রতিটি আইটেমে author আইডি সেট করে দেওয়া ভালো
            const productsWithAuthor = req.body.map(item => ({
                ...item,
                author: req.user?._id || req.user?.id || item.author
            }));
            const savedProducts = await products.insertMany(productsWithAuthor);
            return successResponse(res, 201, 'All products created successfully', savedProducts);
        }

        // সিঙ্গেল প্রোডাক্ট তৈরির ক্ষেত্রে verifyToken থেকে আসা req.user আইডি যুক্ত করা
        const newProduct = new products({
            ...req.body,
            author: req.user?._id || req.user?.id || req.body.author
        });

        const savedProduct = await newProduct.save();

        return successResponse(res, 201, 'Product created successfully', savedProduct);
    } catch (error) {
        return errorResponse(res, 500, "Failed to create a new product", error.message);
    }
};

// ২. Get All Products 
const getAllProducts = async (req, res) => {
    try {
        const { category, color, minPrice, maxPrice, search, page = 1, limit = 10 } = req.query;
        const filter = {};
        
        // (Case-insensitive)
        if (category && category !== 'all') {
            filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
        }
        if (color && color !== 'all') {
            filter.color = { $regex: new RegExp(`^${color}$`, 'i') };
        }
        
        
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }
        
        
        if ((minPrice !== undefined && minPrice !== '') || (maxPrice !== undefined && maxPrice !== '')) {
            filter.price = {};
            if (minPrice !== undefined && minPrice !== '') {
                filter.price.$gte = parseFloat(minPrice);
            }
            if (maxPrice !== undefined && maxPrice !== '' && maxPrice !== 'null') {
                filter.price.$lte = parseFloat(maxPrice);
            }
        }

        console.log("Applied MongoDB Filter:", JSON.stringify(filter));

        
        const currentPage = Math.max(1, parseInt(page));
        const limitPerPage = Math.max(1, parseInt(limit));
        const skip = (currentPage - 1) * limitPerPage;

        
        const [allProducts, totalProducts] = await Promise.all([
            products.find(filter)
                .skip(skip)
                .limit(limitPerPage)
                .populate('author', 'email username')
                .sort({ createdAt: -1 }), 
            products.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalProducts / limitPerPage);

        return successResponse(res, 200, 'Products fetched successfully', {
            products: allProducts,
            totalProducts,
            totalPages,
            currentPage,
            limitPerPage
        });
    } catch (error) {
        return errorResponse(res, 500, "Failed to fetch products", error.message);
    }
};

// ৩. Get Single Product 
const getSingleProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await products.findById(id).populate('author', "username email");
        
        if (!product) {
            return errorResponse(res, 404, "Product not found");
        }

        
        const reviews = await reviewsModel.find({ productId: id }).populate('userId', 'username email');
        
        return successResponse(res, 200, "Single product and reviews", { 
            product, 
            reviews 
        });
    } catch (error) {
        return errorResponse(res, 500, "Failed to get single product", error.message);
    }
};

// ৪. Update a product by ID
const updateProductById = async (req, res) => {
    try {
        const { id } = req.params; 
        const updatedProduct = await products.findByIdAndUpdate(
            id, 
            { ...req.body }, 
            { new: true, runValidators: true } 
        );

        if (!updatedProduct) {
            return errorResponse(res, 404, "Product not found");
        }

        return successResponse(res, 200, 'Product updated successfully', updatedProduct);
    } catch (error) {
        return errorResponse(res, 500, "Failed to update product", error.message);
    }
};

// ৫. Delete Product 
const deleteProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        const deletedProduct = await products.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return errorResponse(res, 404, 'Product not found');
        }

       
        await reviewsModel.deleteMany({ productId: productId });
        
        return successResponse(res, 200, "Product and its reviews deleted successfully");
    } catch (error) {
        return errorResponse(res, 500, 'Failed to delete product', error.message);
    }
};

module.exports = {
    createNewProduct,
    getAllProducts,
    getSingleProduct,
    updateProductById,
    deleteProductById
};