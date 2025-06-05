import express, { json, urlencoded, Request, Response } from "express";
import cors from "cors";
const port = process.env.PORT;
import db from "./db";
import jwt from "jsonwebtoken";

var corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
const app = express();
app.use(cors());

app.use(express.json());
app.use(urlencoded({ extended: true }));

app.get("/", cors(corsOptions), async (req: Request, res: Response) => {
  const [rows]: any = await db.execute(
    "SELECT * FROM users ORDER BY user_name DESC LIMIT 2"
  );
  if (rows && rows.length > 0) {
    console.log(rows);
    res.json({ name: rows[0].user_name, item: rows[0].item_name });
  } else {
    res.json({ error: "No user found" });
  }
});

app.post("/auth/signup", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const [rows]: any = await db.execute(
      "INSERT INTO users (username, email, password) VALUES (?,?,?)",
      [username, email, password]
    );
    res.json({ message: "User created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const [rows]: any = await db.execute(
      "SELECT * FROM users WHERE email = ? AND password = ?",
      [email, password]
    );
    if (rows && rows.length > 0) {
      const token = jwt.sign(
        {
          email,
        },
        "secret285fd5452dt5654",
        { expiresIn: "1h" }
      );
      console.log(token);
      res.json({ message: "User logged in successfully" });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});



app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
