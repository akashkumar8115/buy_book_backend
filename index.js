import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import bookRoute from "./route/book.route.js";
import userRoute from "./route/user.route.js";
import User from "./model/user.model.js"; // Assuming User model is located in models/User.js
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
// const URI = process.env.MongoDBURI;

// defining routes
app.use("/book", bookRoute);
app.use("/user", userRoute);
mongoose.set("debug", true);

// app.get("/", (req, res) => {
//   res.send("Welcome to the API!");
// });

// user/signup route
app.post("/user/signup", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    // Validate input
    if (!fullname || !email || !password) {
      return res
        .status(400)
        .json({ message: "Full name, email, and password are required" });
    }

    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Account already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    user = new User({
      fullname,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Generate JWT token
    // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    //   expiresIn: "1h",
    // });

    // Return success response with the token
    res.status(201).json({ message: "Signup successful", user, token });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// login route
app.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Return success response with the token
    res.status(200).json({ message: "Login successful", user, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error retrieving users:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});
const URI =
  // "mongodb+srv://akash2884182:akash2884182@cluster0.my8k9ww.mongodb.net/books";
  "mongodb+srv://akash2884182:akash2884182@cluster0.my8k9ww.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

const connectWithRetry = () => {
  console.log("Attempting to connect to MongoDB...");
  mongoose
    .connect(URI, {
      serverSelectionTimeoutMS: 50000, // 50 seconds timeout for server selection
      socketTimeoutMS: 60000, // 60 seconds timeout for socket operations
    })
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB:", error);
      console.log("Retrying connection in 5 seconds...");
      // setTimeout(connectWithRetry, 5000); // Retry connection after 5 seconds
    });
};

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
  connectWithRetry(); // Initiate MongoDB connection with retry logic
});
