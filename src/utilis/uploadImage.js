const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const opts = {
  overwrite: true,
  invalidate: true,
  resource_type: "auto",
  folder: "furniro_products", // আপলোড করা ছবি নির্দিষ্ট ফোল্ডারে সেভ হবে
  transformation: [
    { width: 1200, crop: "limit" }, // ছবির সর্বোচ্চ ওয়াইড ১২০০px করবে
    { quality: "auto" },           // ছবির কোয়ালিটি ঠিক রেখে সাইজ কমাবে
    { fetch_format: "auto" }        // WebP বা সেরা ফরম্যাটে কনভার্ট করবে
  ]
};

module.exports = (image) => {
  return new Promise((resolve, reject) => {
    // Cloudinary Credentials চেক
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      return reject(new Error("Cloudinary credentials are missing in Environment Variables!"));
    }

    cloudinary.uploader.upload(image, opts, (error, result) => {
      if (error) {
        console.error("Cloudinary Upload Error:", error);
        return reject(new Error(error.message || "Cloudinary Upload Failed"));
      }

      if (result && result.secure_url) {
        return resolve(result.secure_url);
      }

      reject(new Error("Image upload failed: Secure URL missing"));
    });
  });
};