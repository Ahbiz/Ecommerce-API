import mongoose from "mongoose";
import Product from "../models/Product.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

export const getProducts = asyncHandler(async (req, res) => {
    const {
        lastId,
        lastValue,
        category,
        minRating,
        minPrice,
        maxPrice,
        sort
    } = req.query;

    const filter = {};

    if (category) {
        filter.category = new mongoose.Types.ObjectId(category);
    }

    if (minRating) {
        filter.avgRating = { $gte: Number(minRating) };
    }

    if (minPrice || maxPrice) {
        filter.price = {};
        if (!isNaN(minPrice)) filter.price.$gte = Number(minPrice);
        if (!isNaN(maxPrice)) filter.price.$lte = Number(maxPrice);
    }

    let sortCriteria = {};
    switch (sort) {
        case 'price_asc':
            sortCriteria = { price: 1, _id: 1 };
            break;
        case 'price_desc':
            sortCriteria = { price: -1, _id: 1 };
            break;
        case 'newest':
            sortCriteria = { createdAt: -1, _id: 1 };
            break;
        default:
            sortCriteria = { _id: 1 };
    }

    if (lastId) {
        const idCursor = new mongoose.Types.ObjectId(lastId);

        if (sort === 'price_asc' && lastValue) {
            filter.$or = [
                { price: { $gt: Number(lastValue) } },
                { price: Number(lastValue), _id: { $gt: idCursor } }
            ];
        }
        else if (sort === 'price_desc' && lastValue) {
            filter.$or = [
                { price: { $lt: Number(lastValue) } },
                { price: Number(lastValue), _id: { $gt: idCursor } }
            ];
        }
        else if (sort === 'newest' && lastValue) {
            filter.$or = [
                { createdAt: { $lt: new Date(lastValue) } },
                { createdAt: new Date(lastValue), _id: { $gt: idCursor } }
            ];
        }
        else {
            filter._id = { $gt: idCursor };
        }
    }

    const products = await Product.find(filter)
        .limit(10)
        .sort(sortCriteria);

    res.status(200).json({
        count: products.length,
        products
    });
});

export const addProductReview = asyncHandler(async (req, res) => {
    const { rating, comment, user } = req.body;
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    const newReview = {
        user: user || "Anonymous",
        rating: Number(rating),
        comment
    };

    product.allReviews.push(newReview);

    const totalRating = product.allReviews.reduce((sum, rev) => sum + rev.rating, 0);
    product.avgRating = (totalRating / product.allReviews.length).toFixed(1);
    await product.save();

    res.status(201).json({
        message: "Review added successfully",
        avgRating: product.avgRating,
        product
    });
});
