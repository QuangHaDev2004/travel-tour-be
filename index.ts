import express from "express";
import dotenv from "dotenv";

// Load biến môi trường từ file env
dotenv.config();

import cors from "cors";
import cookieParser from "cookie-parser";
import adminRoutes from "./routes/admin/index.route";
import clientRoutes from "./routes/client/index.route";
import { connectDB } from "./config/database.config";

const app = express();
const port = 8082;

// Kết nối CSDL
connectDB();

// Cấu hình cors
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

// Cho phép gửi dữ liệu lên dạng json
app.use(express.json());

// Lấy được cookie từ fe
app.use(cookieParser());

// app.post("/admin")

// Thiết lập đường dẫn
app.use("/admin", adminRoutes);
app.use("/", clientRoutes);

app.listen(port, () => {
  console.log(`Website đang chạy trên cổng ${port}`);
});
