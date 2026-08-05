const { BASE_URL } = require("../utilis/baseURL");
const Order = require("../orders/order.model");
const { errorResponse, successResponse } = require("../utilis/responsHandler");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// ==========================================
// 1. CREATE NORMAL ORDER (COD / Bank Transfer)
// ==========================================
const createOrder = async (req, res) => {
  try {
    const { billingDetails, products, totalAmount, paymentMethod, userId } = req.body;

    if (!products || products.length === 0) {
      return errorResponse(res, 400, "Products are required to place an order");
    }

    const newOrder = new Order({
      userId: userId || null,
      billingDetails,
      products,
      amount: totalAmount,
      email: billingDetails?.email,
      paymentMethod: paymentMethod || "cash_on_delivery",
      status: "pending",
    });

    const savedOrder = await newOrder.save();

    return successResponse(res, 201, "Order created successfully", savedOrder);
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    return errorResponse(res, 500, "Failed to create order", error.message);
  }
};

// ==========================================
// 2. STRIPE CHECKOUT SESSION
// ==========================================
const makePaymentRequest = async (req, res) => {
  const { products, userId, email } = req.body;

  try {
    const lineItems = products.map((product) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name,
          images: product.image ? [product.image] : [],
        },
        unit_amount: Math.round(product.price * 100),
      },
      quantity: product.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      customer_email: email,
      metadata: {
        userId: userId || "",
      },
      success_url: `${BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/cancel`,
    });

    res.status(200).json({
      id: session.id,
      url: session.url,
    });
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Failed to create payment session",
      error.message
    );
  }
};

// ==========================================
// 3. CONFIRM STRIPE PAYMENT
// ==========================================
const confirmPayment = async (req, res) => {
  const { session_id } = req.body;
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items", "payment_intent"],
    });
    const paymentIntentId = session.payment_intent.id;
    let order = await Order.findOne({ orderId: paymentIntentId });

    if (!order) {
      const lineItems = session.line_items.data.map((item) => ({
        productId: item.price.product,
        quantity: item.quantity,
      }));
      const amount = session.amount_total / 100;
      order = new Order({
        orderId: paymentIntentId,
        products: lineItems,
        amount: amount,
        email: session.customer_details?.email || session.customer_email,
        status:
          session.payment_intent.status === "succeeded"
            ? "pending"
            : "failed",
      });
    } else {
      order.status =
        session.payment_intent.status === "succeeded" ? "pending" : "failed";
    }
    await order.save();
    return successResponse(res, 200, "Order confirmed successfully", order);
  } catch (error) {
    console.error("CONFIRM PAYMENT ERROR:", error);
    return errorResponse(
      res,
      500,
      "Failed to confirm payment",
      error.message
    );
  }
};

// ==========================================
// 4. GET ORDERS BY EMAIL
// ==========================================
const getOrdersByEmail = async (req, res) => {
  const email = req.params.email;
  try {
    if (!email) {
      return errorResponse(res, 400, "Email is required");
    }
    const orders = await Order.find({ email }).sort({ createdAt: -1 });
    if (!orders || orders.length === 0) {
      return errorResponse(res, 400, "No orders found for this email");
    }
    return successResponse(res, 200, "Orders fetched successfully", orders);
  } catch (error) {
    return errorResponse(res, 500, "Failed to get orders", error.message);
  }
};

// ==========================================
// 5. GET ORDER BY ID
// ==========================================
const getOrdersByOrdersId = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return errorResponse(res, 404, "Order not found");
    }

    return successResponse(
      res,
      200,
      "Order fetched successfully",
      order
    );
  } catch (error) {
    console.error("GET ORDER ERROR:", error);
    return errorResponse(res, 500, "Failed to get order", error.message);
  }
};

// ==========================================
// 6. GET ALL ORDERS
// ==========================================
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return errorResponse(res, 404, "No orders found");
    }

    return successResponse(
      res,
      200,
      "Orders fetched successfully",
      orders
    );
  } catch (error) {
    console.error("GET ALL ORDERS ERROR:", error);
    return errorResponse(
      res,
      500,
      "Failed to get all orders",
      error.message
    );
  }
};

// ==========================================
// 7. UPDATE ORDER STATUS
// ==========================================
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    return errorResponse(res, 400, "Status is required");
  }
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!updatedOrder) {
      return errorResponse(res, 404, "Order not found");
    }
    return successResponse(
      res,
      200,
      "Order status updated successfully",
      updatedOrder
    );
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Failed to update order status",
      error.message
    );
  }
};

// ==========================================
// 8. DELETE ORDER BY ID
// ==========================================
const deleteOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedOrder = await Order.findByIdAndDelete(id);
    if (!deletedOrder) {
      return errorResponse(res, 404, "Order not found");
    }
    return successResponse(
      res,
      200,
      "Order deleted successfully",
      deletedOrder
    );
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Failed to delete order",
      error.message
    );
  }
};

module.exports = {
  createOrder, 
  makePaymentRequest,
  confirmPayment,
  getOrdersByEmail,
  getOrdersByOrdersId,
  getAllOrders,
  updateOrderStatus,
  deleteOrderById,
};