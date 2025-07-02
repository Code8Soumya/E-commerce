import express from "express";
import cors from "cors";
import authRouter from "./routes/authRoutes";
import productRouter from "./routes/productRoutes";
import cartRouter from "./routes/cartRoutes";
import orderRouter from "./routes/orderRoutes";

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);

const PORT = Number(process.env.PORT) || 3000;

// Only start server if not in Lambda environment
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
    app.listen(PORT, () => {
        console.log(`App listening on port ${PORT}`);
    });
}

export = app;
