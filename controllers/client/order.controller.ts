import { Request, Response } from "express";
import { generateRandomNumber } from "../../helpers/generate.helper";
import Tour from "../../models/tour.model";
import Order from "../../models/order.model";
import City from "../../models/city.model";
import moment from "moment";
import {
  paymentMethodList,
  paymentStatusList,
  statusList,
} from "../../config/variable.config";
import axios from "axios";
import CryptoJS from "crypto-js";
import { sortObject } from "../../helpers/sort.helper";

/**
 * Xử lý tạo đơn đặt tour mới.
 * Thực hiện: Tính tổng tiền, trừ số lượng tồn kho của từng loại vé và lưu DB.
 * @param {Request} req - Chứa danh sách items (tourId, quantity) và thông tin khách hàng.
 * @param {Response} res - Trả về mã đơn hàng orderCode nếu thành công.
 * @author QuangHaDev - 28.11.2025
 */
export const createPost = async (req: Request, res: Response) => {
  try {
    req.body.orderCode = "OD" + generateRandomNumber(10);

    req.body.subTotal = 0;

    for (const item of req.body.items) {
      const itemInfo = await Tour.findOne({
        _id: item.tourId,
        deleted: false,
        status: "active",
      });

      if (itemInfo) {
        item.priceNewAdult = itemInfo.priceNewAdult;
        item.priceNewChildren = itemInfo.priceNewChildren;
        item.priceNewBaby = itemInfo.priceNewBaby;
        item.departureDate = itemInfo.departureDate;

        req.body.subTotal +=
          item.priceNewAdult * item.quantityAdult +
          item.priceNewChildren * item.quantityChildren +
          item.priceNewBaby * item.quantityBaby;

        if (
          itemInfo.stockAdult == null ||
          itemInfo.stockChildren == null ||
          itemInfo.stockBaby == null
        ) {
          throw new Error("Số lượng không hợp lệ!");
        }

        await Tour.updateOne(
          {
            _id: item.tourId,
          },
          {
            stockAdult: itemInfo.stockAdult - item.quantityAdult,
            stockChildren: itemInfo.stockChildren - item.quantityChildren,
            stockBaby: itemInfo.stockBaby - item.quantityBaby,
          },
        );
      }
    }

    req.body.discount = 0;

    req.body.total = req.body.subTotal - req.body.discount;

    req.body.paymentStatus = "unpaid";

    req.body.status = "initial";

    const newRecord = new Order(req.body);
    await newRecord.save();

    res.status(201).json({
      message: "Chúc mừng bạn đã đặt tour thành công!",
      orderCode: req.body.orderCode,
    });
  } catch (error) {
    console.log("Có lỗi khi gọi order createPost", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

/**
 * Lấy thông tin chi tiết đơn hàng sau khi đặt thành công.
 * Hỗ trợ format dữ liệu hiển thị (ngày tháng, tên trạng thái, thông tin tour đi kèm).
 * @param {Request} req - Query params bao gồm orderCode và phone.
 * @author QuangHaDev - 29.11.2025
 */
export const success = async (req: Request, res: Response) => {
  try {
    const { orderCode, phone } = req.query;

    const orderDetail = await Order.findOne({
      orderCode: orderCode,
      phone: phone,
    });

    if (!orderDetail) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại!" });
    }

    const dataFinal = {
      orderCode: orderDetail.orderCode,
      fullName: orderDetail.fullName,
      phone: orderDetail.phone,
      note: orderDetail.note,
      subTotal: orderDetail.subTotal,
      discount: orderDetail.discount,
      total: orderDetail.total,
      createdAtFormat: "",
      paymentMethodName: "",
      paymentStatusName: "",
      statusName: "",
      items: [] as any,
    };

    if (orderDetail.createdAt) {
      dataFinal.createdAtFormat = moment(orderDetail.createdAt).format(
        "HH:mm - DD/MM/YYYY",
      );
    }

    if (orderDetail.paymentMethod) {
      dataFinal.paymentMethodName =
        paymentMethodList.find(
          (item) => item.value === orderDetail.paymentMethod,
        )?.label ?? "";
    }

    if (orderDetail.paymentStatus) {
      dataFinal.paymentStatusName =
        paymentStatusList.find(
          (item) => item.value === orderDetail.paymentStatus,
        )?.label ?? "";
    }

    if (orderDetail.status) {
      dataFinal.statusName =
        statusList.find((item) => item.value === orderDetail.status)?.label ??
        "";
    }

    if (orderDetail.items && orderDetail.items.length > 0) {
      for (const item of orderDetail.items) {
        const itemFinal = {
          tourId: item.tourId,
          quantityAdult: item.quantityAdult,
          quantityChildren: item.quantityChildren,
          quantityBaby: item.quantityBaby,
          priceNewAdult: item.priceNewAdult,
          priceNewChildren: item.priceNewChildren,
          priceNewBaby: item.priceNewBaby,
          departureDateFormat: "",
          avatar: "",
          name: "",
          slug: "",
          locationsFromFormat: "",
        };

        if (item.departureDate) {
          itemFinal.departureDateFormat = moment(item.departureDate).format(
            "DD/MM/YYYY",
          );
        }

        const tourInfo = await Tour.findOne({
          _id: item.tourId,
          deleted: false,
          status: "active",
        });

        if (tourInfo) {
          itemFinal.avatar = tourInfo.avatar as string;
          itemFinal.name = tourInfo.name as string;
          itemFinal.slug = tourInfo.slug as string;

          // sửa lại nếu có chọn điểm khởi hành
          const cityInfo = await City.find({
            _id: { $in: tourInfo.locationsFrom },
          });
          itemFinal.locationsFromFormat = cityInfo
            .map((item) => item.name)
            .join(", ");
        }

        dataFinal.items.push(itemFinal);
      }
    }

    res.status(200).json({ orderDetail: dataFinal });
  } catch (error) {
    console.log("Có lỗi khi gọi order success", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

/**
 * Khởi tạo giao dịch thanh toán qua cổng ZaloPay.
 * Tạo mã MAC bảo mật và redirect người dùng sang trang thanh toán của ZaloPay.
 * @author QuangHaDev - 30.11.2025
 */
export const paymentZaloPay = async (req: Request, res: Response) => {
  try {
    const { orderCode, phone } = req.query;

    const orderDetail = await Order.findOne({
      orderCode: orderCode,
      phone: phone,
    });

    if (!orderDetail) {
      return res.redirect("/");
    }

    // Gửi dữ liệu lên ZaloPay
    const config = {
      app_id: process.env.ZALOPAY_APPID,
      key1: process.env.ZALOPAY_KEY1,
      key2: process.env.ZALOPAY_KEY2,
      endpoint: process.env.ZALOPAY_DOMAIN,
    };

    const embed_data = {
      redirecturl: `${process.env.WEBSITE_DOMAIN_FE}/order/success?orderCode=${orderCode}&phone=${phone}`,
    };

    const items = [{}];
    const transID = Math.floor(Math.random() * 1000000);
    const order = {
      app_id: config.app_id,
      app_trans_id: `${moment().format("YYMMDD")}_${transID}`,
      app_user: `${phone}-${orderCode}`,
      app_time: Date.now(), // miliseconds
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embed_data),
      amount: orderDetail.total,
      description: `Thanh toán đơn hàng ${orderCode}`,
      bank_code: "",
      callback_url: `${process.env.WEBSITE_DOMAIN_BE}/order/payment-zalopay-result`,
    };

    const data =
      config.app_id +
      "|" +
      order.app_trans_id +
      "|" +
      order.app_user +
      "|" +
      order.amount +
      "|" +
      order.app_time +
      "|" +
      order.embed_data +
      "|" +
      order.item;
    (order as any).mac = CryptoJS.HmacSHA256(data, `${config.key1}`).toString();

    const response = await axios.post(`${config.endpoint}`, null, {
      params: order,
    });
    if (response.data.return_code === 1) {
      res.redirect(response.data.order_url);
    }
  } catch (error) {
    console.log("Có lỗi khi gọi order paymentZaloPay", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

/**
 * Xử lý Callback (Webhook) từ ZaloPay Server sau khi người dùng thanh toán.
 * Xác thực mã MAC và cập nhật trạng thái 'paid' cho đơn hàng trong CSDL.
 * @author QuangHaDev - 30.11.2025
 */
export const paymentZaloPayResultPost = async (req: Request, res: Response) => {
  const config = {
    key2: process.env.ZALOPAY_KEY2,
  };

  let result: any = {};

  try {
    let dataStr = req.body.data;
    let reqMac = req.body.mac;

    let mac = CryptoJS.HmacSHA256(dataStr, `${config.key2}`).toString();

    // kiểm tra callback hợp lệ (đến từ ZaloPay server)
    if (reqMac !== mac) {
      // callback không hợp lệ
      result.return_code = -1;
      result.return_message = "mac not equal";
    } else {
      // thanh toán thành công
      // merchant cập nhật trạng thái cho đơn hàng
      let dataJson = JSON.parse(dataStr);

      // Cập nhật paymentStatus trong CSDL
      const [phone, orderCode] = dataJson.app_user.split("-");
      await Order.updateOne(
        {
          phone: phone,
          orderCode: orderCode,
        },
        {
          paymentStatus: "paid",
        },
      );

      result.return_code = 1;
      result.return_message = "success";
    }
  } catch (ex: any) {
    result.return_code = 0; // ZaloPay server sẽ callback lại (tối đa 3 lần)
    result.return_message = ex.message;
  }

  // thông báo kết quả cho ZaloPay server
  res.json(result);
};

/**
 * Khởi tạo giao dịch thanh toán qua cổng VNPay.
 * Cấu hình các tham số vnp_Params, tạo chữ ký SHA512 và redirect tới VNPay.
 * @author QuangHaDev - 30.11.2025
 */
export const paymentVNPay = async (req: Request, res: Response) => {
  try {
    const { orderCode, phone } = req.query;

    const orderDetail = await Order.findOne({
      orderCode: orderCode,
      phone: phone,
    });

    if (!orderDetail) {
      return res.redirect("/");
    }

    // Gửi dữ liệu lên VNPay
    let date = new Date();
    let createDate = moment(date).utcOffset(7).format("YYYYMMDDHHmmss");

    let ipAddr =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket?.remoteAddress ||
      undefined;

    let tmnCode = process.env.VNPAY_TMNCODE;
    let secretKey = process.env.VNPAY_SECRET_KEY;
    let vnpUrl =
      process.env.VNPAY_URL ||
      "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    let returnUrl = `${process.env.WEBSITE_DOMAIN_BE}/order/payment-vnpay-result`;
    let orderId = `${phone}-${orderCode}-${Date.now()}`;
    let amount = orderDetail.total ?? 0;
    let bankCode = "";

    let locale = "vn";
    if (locale === null || locale === "") {
      locale = "vn";
    }
    let currCode = "VND";
    let vnp_Params: any = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = locale;
    vnp_Params["vnp_CurrCode"] = currCode;
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100;
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;
    if (bankCode !== null && bankCode !== "") {
      vnp_Params["vnp_BankCode"] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    let querystring = require("qs");
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

    res.redirect(vnpUrl);
  } catch (error) {
    console.log("Có lỗi khi gọi order paymentVNPay", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

/**
 * Xử lý kết quả trả về từ VNPay (Return URL).
 * Kiểm tra tính hợp lệ của chữ ký và cập nhật trạng thái thanh toán đơn hàng.
 * @author QuangHaDev - 30.11.2025
 */
export const paymentVNPayResult = async (req: Request, res: Response) => {
  let vnp_Params = req.query;

  let secureHash = vnp_Params["vnp_SecureHash"] as string | undefined;

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);

  let secretKey = process.env.VNPAY_SECRET_KEY;

  let querystring = require("qs");
  let signData = querystring.stringify(vnp_Params, { encode: false });
  let crypto = require("crypto");
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

  if (secureHash === signed) {
    //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
    if (
      vnp_Params["vnp_TransactionStatus"] == "00" &&
      vnp_Params["vnp_ResponseCode"] == "00"
    ) {
      const txnRef = vnp_Params["vnp_TxnRef"] as string | undefined;
      if (!txnRef) {
        return res.status(400).send("Transaction reference missing");
      }

      const [phone, orderCode] = txnRef.split("-");
      await Order.updateOne(
        {
          phone: phone,
          orderCode: orderCode,
        },
        {
          paymentStatus: "paid",
        },
      );

      res.redirect(
        `${process.env.WEBSITE_DOMAIN_FE}/order/success?orderCode=${orderCode}&phone=${phone}`,
      );
    }

    res.render("success", { code: vnp_Params["vnp_ResponseCode"] });
  } else {
    res.redirect("/");
  }
};

/**
 * Tra cứu lịch sử đơn hàng dựa trên số điện thoại khách hàng.
 * Trả về danh sách đơn hàng kèm thông tin tour chi tiết (tên, ảnh, ngày khởi hành).
 * @param {Request} req - Query param phone.
 * @author QuangHaDev - 04.04.2026
 */
export const tracking = async (req: Request, res: Response) => {
  try {
    const phone = req.query.phone;

    if (!phone) {
      return res.status(400).json({ message: "Số điện thoại là bắt buộc." });
    }

    // lấy danh sách order
    const orders = await Order.find({
      phone: phone,
      deleted: false,
    }).sort({ createdAt: -1 });

    if (!orders.length) {
      return res.json([]);
    }

    const dataFinal = [];

    for (const order of orders) {
      const orderData = {
        orderId: order._id,
        orderCode: order.orderCode,
        status: order.status,
        createdAtFormat: "",
        total: order.total,
        paymentStatus: order.paymentStatus,
        items: [] as any,
      };

      if (order.createdAt) {
        orderData.createdAtFormat = moment(order.createdAt).format(
          "DD/MM/YYYY",
        );
      }

      const tourIds = order.items.map((item) => item.tourId);
      const tours = await Tour.find({
        _id: { $in: tourIds },
        deleted: false,
        status: "active",
      });

      for (const tour of tours) {
        const itemData = {
          tourId: tour._id,
          name: tour.name,
          avatar: tour.avatar,
          slug: tour.slug,
          locationsFromFormat: "",
          departureDateFormat: "",
        };

        const cityInfo = await City.find({
          _id: { $in: tour.locationsFrom },
        });

        if (cityInfo) {
          itemData.locationsFromFormat =
            cityInfo.map((item) => item.name).join(", ") || "Chưa xác định";
        }

        if (tour.departureDate) {
          itemData.departureDateFormat =
            moment(tour.departureDate).format("DD/MM/YYYY") || "Chưa xác định";
        }

        orderData.items.push(itemData);
      }

      dataFinal.push(orderData);
    }

    res.status(200).json({ orderTracking: dataFinal });
  } catch (error) {
    console.log("Có lỗi khi gọi order tracking: ", error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

/**
 * Xử lý hủy đơn hàng từ phía người dùng.
 * Chỉ cho phép hủy đơn ở trạng thái 'initial' và chưa thanh toán.
 * @param {Request} req - Body chứa orderId.
 * @author QuangHaDev - 04.04.2026
 */
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "ID đơn hàng là bắt buộc." });
    }

    const order = await Order.findOne({
      _id: orderId,
      deleted: false,
    });

    if (!order) {
      return res.status(404).json({
        message: "Đơn hàng không tồn tại.",
      });
    }

    if (order.status !== "initial") {
      return res.status(400).json({
        message: "Không thể hủy đơn hàng này.",
      });
    }

    if (order.paymentStatus !== "unpaid") {
      return res.status(400).json({
        message: "Đơn đã thanh toán, không thể hủy.",
      });
    }

    await Order.updateOne(
      {
        _id: orderId,
        deleted: false,
      },
      {
        status: "cancel",
      },
    );

    res.status(200).json({ message: "Hủy đơn hàng thành công." });
  } catch (error) {
    console.log("Có lỗi khi gọi cancel order: ", error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
