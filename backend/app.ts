import express, { json, urlencoded, Request, Response } from "express";
import cors from "cors";
// import dotenv from "dotenv"; // Removed as env is loaded via --env-file in package.json script
import authRouter from "./routes/authRoutes";
import productRouter from "./routes/productRoutes";
import cartRouter from "./routes/cartRoutes";
import orderRouter from "./routes/orderRoutes";

// dotenv.config({ path: "./.env" }); // Removed as env is loaded via --env-file in package.json script

const app = express();
app.use(cors());

app.use(express.json());
app.use(urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);

const PORT = Number(process.env.PORT);

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});
