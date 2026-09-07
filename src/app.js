import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

import notFoundHandler from "./shared/middleware/notFound.js";
import globalErrorHandler from "./shared/errors/globalErrorHandler.js";

import authRoutes from "./modules/auth/auth.routes.js";
import productRoutes from "./modules/product/product.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import invoiceRoutes from "./modules/saleInvoices/saleInvoice.routes.js";
import backupRoutes from "./modules/backup/backup.routes.js";
import supplierRoutes from "./modules/supplier/supplier.routes.js";
import purchaseCartRoutes from "./modules/purchaseCart/purchaseCart.routes.js";
import purchaseInvoiceRoutes from "./modules/purchaseInvoice/purchaseInvoice.routes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../public")));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/carts", cartRoutes);
app.use("/api/v1/carts", invoiceRoutes);
app.use("/api/v1/backup", backupRoutes);
app.use("/api/v1/suppliers", supplierRoutes);
app.use("/api/v1/purchasesCart", purchaseCartRoutes);
app.use("/api/v1/purchasesCart", purchaseInvoiceRoutes);

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

//* 404 Handler
app.use(notFoundHandler);

//* Error Handler
app.use(globalErrorHandler);

export default app;
