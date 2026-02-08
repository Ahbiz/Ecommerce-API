import express from "express";
import { getProducts, addProductReview } from "../controllers/product.controller.js";

const router = express.Router();

// GET all products (with filtering for Category, ID, and Rating)
router.get("/", getProducts);

// POST a new review to a specific product
// Example URL: http://localhost:5000/api/products/6987aa.../reviews
router.post("/:id/reviews", addProductReview);

export default router;