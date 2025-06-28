import express, { json, urlencoded, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/authRoutes";
import productRouter from "./routes/productRoutes";
import cartRouter from "./routes/cartRoutes";

dotenv.config();

const app = express();
app.use(cors());

app.use(express.json());
app.use(urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);

const PORT = Number(process.env.PORT);

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});
