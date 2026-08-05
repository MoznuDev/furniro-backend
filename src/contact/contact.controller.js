const Contact = require("./contact.model");

// ১. নতুন মেসেজ সেভ করা (Public Route - User)
const createContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required fields.",
      });
    }

    const newMessage = await Contact.create({
      name,
      email,
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Your message has been sent successfully!",
      data: newMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error. Failed to send message.",
      error: error.message,
    });
  }
};

// ২. সব মেসেজ পাওয়া (Admin Route)
const getAllContactMessages = async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error. Could not fetch messages.",
      error: error.message,
    });
  }
};

// ৩. মেসেজ Unread থেকে Read স্ট্যাটাস করা (Admin Route)
const updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedMessage = await Contact.findByIdAndUpdate(
      id,
      { status: "Read" },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: updatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
};

// ৪. মেসেজ ডিলিট করা (Admin Route)
const deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedMessage = await Contact.findByIdAndDelete(id);

    if (!deletedMessage) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error.message,
    });
  }
};

module.exports = {
  createContactMessage,
  getAllContactMessages,
  updateMessageStatus,
  deleteContactMessage,
};