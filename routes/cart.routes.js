import express from "express";
import { addToCart, getCart, removeItemFromCart, updateQuantity } from "../controllers/cart.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();


router.post("/", protect, addToCart);
router.get("/", protect, getCart);
router.delete("/:productId", protect, removeItemFromCart);
router.put("/", protect, updateQuantity);

export default router;