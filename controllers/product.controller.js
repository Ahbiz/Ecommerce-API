import mongoose from "mongoose";
import Product from "../models/Product.model.js";
export const getProducts = async (req, res) => {
    try {
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
            if (isNaN(minPrice)) filter.price.$gte = Number(minPrice);
            if (isNaN(maxPrice)) filter.price.$lte = Number(maxPrice);
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

    } catch (error) {
        res.status(500).json({ message: "Error fetching products", error: error.message });
    }
};

export const addProductReview = async (req, res) => {
    try {
        const { rating, comment, user } = req.body;
        const { id } = req.params;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const newReview = {
            user: user || "Anonymous",
            rating: Number(rating),
            comment
        };

        product.allReviews.push(newReview);
        await product.save();

        res.status(201).json({
            message: "Review added successfully",
            avgRating: product.avgRating,
            product
        });
    } catch (error) {
        res.status(500).json({ message: "Error adding review", error: error.message });
    }
};