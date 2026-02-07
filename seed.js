import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import Product from './models/Product.model.js';
import Category from './models/Category.model.js';
import User from './models/User.model.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.mongodb_uri || 'mongodb://localhost:27017/ecommerce';

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB...");

        await Category.deleteMany();
        await Product.deleteMany();
        console.log("Cleared old data.");

        const categories = await Category.insertMany([
            { name: 'Electronics', description: 'Gadgets and tech' },
            { name: 'Clothing', description: 'Fashion and apparel' },
            { name: 'Home & Kitchen', description: 'Household items' },
            { name: 'Books', description: 'Educational and fiction' }
        ]);
        console.log("Categories created.");

        const products = [];
        for (let i = 0; i < 50; i++) {
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];

            products.push({
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
                inventoryCount: Math.floor(Math.random() * 100),
                category: randomCategory._id,
                image: faker.image.url()
            });
        }

        await Product.insertMany(products);
        console.log("50 Products seeded successfully!");

        await mongoose.connection.close();
        console.log("Connection closed.");
    } catch (error) {
        console.error("Error seeding data:", error);
        process.exit(1);
    }
};

seedDatabase();