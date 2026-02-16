import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

export const addToCart = asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user;

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    if (product.inventoryCount < quantity) {
        res.status(400);
        throw new Error(`Only ${product.inventoryCount} items in stock`);
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = new Cart({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
        const newQuantity = cart.items[itemIndex].quantity + quantity;
        if (newQuantity > product.inventoryCount) {
            res.status(400);
            throw new Error("Total cart quantity exceeds stock");
        }
        cart.items[itemIndex].quantity = newQuantity;
    } else {
        cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    res.status(200).json(cart);
});

export const getCart = asyncHandler(async (req, res) => {
    const userId = req.user;

    const cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price image');
    if (!cart) {
        res.status(404);
        throw new Error("Cart not found");
    }

    const itemsWithTotals = cart.items.map(item => ({
        ...item._doc,
        itemTotal: (item.product.price * item.quantity).toFixed(2)
    }));

    const grandTotal = itemsWithTotals.reduce((sum, item) => sum + Number(item.itemTotal), 0).toFixed(2);

    res.status(200).json({
        cartId: cart._id,
        items: itemsWithTotals,
        grandTotal
    });
});

export const removeItemFromCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        res.status(404);
        throw new Error("Cart not found");
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();

    res.status(200).json({ message: "Item removed", cart });
});

export const updateQuantity = asyncHandler(async (req, res) => {
    const { productId, newQuantity } = req.body;
    const userId = req.user;

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    if (product.inventoryCount < newQuantity) {
        res.status(400);
        throw new Error(`Insufficient stock. Only ${product.inventoryCount} left.`);
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        res.status(404);
        throw new Error("Cart not found");
    }

    const item = cart.items.find(item => item.product.toString() === productId);

    if (item) {
        item.quantity = newQuantity;
        await cart.save();
        res.status(200).json({ message: "Quantity updated", cart });
    } else {
        res.status(404);
        throw new Error("Product not in cart");
    }
});