import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product Name is required'],
        trim: true,
        minLength: 2,
        maxLength: 50,
    },
    description: {
        type: String,
        required: [true, 'Product Description is required'],
        trim: true,
        minLength: 10,
        maxLength: 500,
    },
    price: {
        type: Number,
        required: [true, 'Product Price is required'],
        min: 0,
    },
    inventoryCount: {
        type: Number,
        required: [true, 'Inventory Count is required'],
        min: 0,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    image: {
        type: String,
        required: [true, 'Product Image is required'],
    },
    // NEW: Added Embedded Reviews
    allReviews: [{
        user: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String }
    }],
    // NEW: Added avgRating field
    avgRating: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    // This allows virtuals to show up in Postman/JSON responses
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

productSchema.pre('save', function (next) {
    if (this.allReviews && this.allReviews.length > 0) {
        const total = this.allReviews.reduce((sum, review) => sum + review.rating, 0);
        this.avgRating = Number(total / this.allReviews.length).toFixed(1); // Rounds to 1 decimal
    } else {
        this.avgRating = 0;
    }
    next();
});
const Product = mongoose.model('Product', productSchema);
export default Product;