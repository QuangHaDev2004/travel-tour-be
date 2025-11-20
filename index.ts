import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
const port = 8082;

// Cấu hình cors
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
  })
);

// Cho phép gửi dữ liệu lên dạng json
app.use(express.json());

app.post("/admin/account/register", (req: Request, res: Response) => {
  console.log(req.body);

  res.status(201).json({ message: "Đăng ký tài khoản thành công!" });
});

app.listen(port, () => {
  console.log(`Website đang chạy trên cổng ${port}`);
});
