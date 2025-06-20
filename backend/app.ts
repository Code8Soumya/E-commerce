import express, { json, urlencoded, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/authRoutes";
import productRouter from "./routes/productRoutes";

dotenv.config();

var corsOptions = {
    origin: "http://localhost:3000",
    optionsSuccessStatus: 200,
};

const app = express();
app.use(cors());

app.use(express.json());
app.use(urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);

const PORT = Number(process.env.PORT);

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});
