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
    }
}, { timestamps: true })

const Product = mongoose.model('Product', productSchema);
export default Product;