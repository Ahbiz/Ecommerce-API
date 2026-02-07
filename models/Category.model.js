import mongoose from "mongoose";
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category Name is required'],
        trim: true,
        unique: true,
        minLength: 2,
        maxLength: 50,
    },
    description: {
        type: String,
        required: [true, 'Category Description is required'],
        trim: true,
        maxLength: 500,
    }
}, { timestamps: true })

const Category = mongoose.model('Category', categorySchema);
export default Category;