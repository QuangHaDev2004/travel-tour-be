import { Router } from "express";
import * as orderController from "../../controllers/client/order.controller";

const router = Router();

router.post("/create", orderController.createPost);

router.get("/success", orderController.success);

router.get("/payment-zalopay", orderController.paymentZaloPay);

router.post("/payment-zalopay-result", orderController.paymentZaloPayResultPost);

router.get("/payment-vnpay", orderController.paymentVNPay);

router.get("/payment-vnpay-result", orderController.paymentVNPayResult);

export default router;
