import express from "express";
import dotenv from "dotenv";
import dbconnection from "./config/db.js";
import productRoutes from "./routes/product.routes.js";

dotenv.config();

const app = express();

app.use(express.json());

dbconnection();

const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use("/api/products", productRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});