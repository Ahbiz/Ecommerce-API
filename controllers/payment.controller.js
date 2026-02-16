import Flutterwave from 'flutterwave-node-v3';
import Transaction from '../models/Transaction.model.js';
import Cart from '../models/Cart.model.js';
import User from '../models/User.model.js';
import dotenv from 'dotenv';
import { asyncHandler } from '../middleware/error.middleware.js';

dotenv.config();

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

export const initiatePayment = asyncHandler(async (req, res) => {
    const userId = req.user;

    // 1. Get user details
    const user = await User.findById(userId);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    // 2. Get cart details and calculate total
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
        res.status(400);
        throw new Error("Cart is empty");
    }

    const amount = cart.items.reduce((sum, item) => {
        return sum + (item.product.price * item.quantity);
    }, 0);

    const tx_ref = `tx-${Date.now()}-${userId}`;

    // 3. Create a pending record in your DB
    await Transaction.create({
        user: userId,
        tx_ref,
        amount,
        email: user.email,
        status: 'pending'
    });

    // 4. Prepare Flutterwave payload
    const payload = {
        tx_ref,
        amount,
        currency: "NGN",
        redirect_url: `${req.protocol}://${req.get('host')}/api/payment/verify`,
        customer: {
            email: user.email,
            name: user.name,
        },
        customizations: {
            title: "Ecommerce Order Payment",
            description: `Payment for items in cart (${cart.items.length} items)`
        }
    };

    // 5. Generate Payment Link
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.status === "success") {
        res.status(200).json({
            message: "Payment link generated",
            link: data.data.link
        });
    } else {
        res.status(400);
        throw new Error(data.message || "Failed to generate payment link");
    }
});

export const verifyPayment = asyncHandler(async (req, res) => {
    const { transaction_id, status, tx_ref } = req.query;

    if (status === 'successful' || status === 'completed') {
        const response = await flw.Transaction.verify({ id: transaction_id });

        if (response.data.status === "successful") {
            // Find the transaction in our DB
            const transaction = await Transaction.findOne({ tx_ref });

            if (!transaction) {
                res.status(404);
                throw new Error("Transaction record not found");
            }

            // Verify amount and currency
            if (response.data.amount === transaction.amount && response.data.currency === transaction.currency) {
                // Update transaction status
                transaction.status = 'successful';
                transaction.transactionId = transaction_id;
                await transaction.save();

                // Empty the user's cart after successful payment
                await Cart.findOneAndDelete({ user: transaction.user });

                return res.status(200).json({
                    message: "Payment successful and verified",
                    transaction
                });
            } else {
                res.status(400);
                throw new Error("Payment verification failed: Amount or currency mismatch");
            }
        } else {
            res.status(400);
            throw new Error("Payment not successful on Flutterwave");
        }
    } else {
        // Update transaction to failed
        await Transaction.findOneAndUpdate({ tx_ref }, { status: 'failed' });
        res.status(400);
        throw new Error("Payment failed or cancelled");
    }
});
