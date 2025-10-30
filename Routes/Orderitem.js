import express from "express";
import { Auth } from "../Middleware/Auth.js";
import {
  createOrderItem, getAllOrderItems, getOrderItemById,
  updateOrderItem, deleteOrderItem
} from "../Controller/Orderitem.js";

const router = express.Router();

router.post("/create", Auth, createOrderItem);
router.get("/all", Auth, getAllOrderItems);
router.get("/byId/:id", Auth, getOrderItemById);
router.put("/update/:id", Auth, updateOrderItem);
router.delete("/delete/:id", Auth, deleteOrderItem);

export default router;
