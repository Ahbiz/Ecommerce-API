import express from "express";
import { getProducts, addProductReview } from "../controllers/product.controller.js";

const router = express.Router();

router.get("/", getProducts);

router.post("/:id/review", addProductReview);

export default router;