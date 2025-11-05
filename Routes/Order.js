import express from "express";
import {
  createOrder, getOrderById, updateOrder, deleteOrder, getAllOrders,
  confirmOrderPayment, refundOrderPayment
} from "../Controller/Order.js";
import { Auth, authorizeRoles } from "../Middleware/Auth.js";

const router = express.Router();

router.post("/create", Auth, createOrder);
router.get("/all", Auth, getAllOrders);
router.get("/byId/:id", Auth, getOrderById);
router.put("/update/:id", Auth, updateOrder);
router.delete("/delete/:id", Auth, deleteOrder);

router.post("/confirm/:id", Auth, authorizeRoles("admin"), async (req, res) => {
  const result = await confirmOrderPayment(req.params.id);
  if (result.success) return res.json(result);
  res.status(500).json(result);
});

router.post("/refund/:id", Auth, authorizeRoles("admin"), async (req, res) => {
  const { amount } = req.body;
  const result = await refundOrderPayment(req.params.id, amount);
  if (result.success) return res.json(result);
  res.status(500).json(result);
});

export default router;

