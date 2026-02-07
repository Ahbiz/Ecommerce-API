import express from "express";
import dotenv from "dotenv";
import dbconnection from "./config/db.js";

dotenv.config();

dbconnection();

const app = express();

const PORT = process.env.PORT || 5000;
app.get('/', (req, res) =>  {
    res.send('Hello World!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
}); 