import express from "express";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import dotenv from "dotenv";
import dbconnection from "./config/db.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use("/api/auth", authRoutes)

dbconnection();

const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});