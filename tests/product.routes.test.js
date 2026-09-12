import request from "supertest";
import { jest } from "@jest/globals";
import app from "../src/app.js";
import productService from "../src/modules/product/product.service.js";
import authRepository from "../src/modules/auth/auth.repository.js";
import jwt from "../src/shared/utils/jwt.js";

describe("Product Routes Integration Tests", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    
    // شبیه‌سازی میدلور احراز هویت برای جلوگیری از خطای 401 و 500
    jest.spyOn(jwt, "verifyToken").mockReturnValue({ id: 1, tokenVersion: 1 });
    jest.spyOn(authRepository, "getAdmin").mockResolvedValue({ id: 1, token_version: 1 });
  });

  const now = Date.now();
  const validCookie = [`token=valid_token; lastActivity=${now}`];

  // ==========================================
  // GET & POST /api/v1/products
  // ==========================================
  describe("GET /api/v1/products", () => {
    it("should fetch all products with pagination", async () => {
      const mockData = {
        products: [{ id: 1, name: "Product A", barcode: "1234" }],
        pagination: { page: 1, limit: 20, total: 1 },
      };
      jest.spyOn(productService, "getProducts").mockResolvedValue(mockData);

      const response = await request(app)
        .get("/api/v1/products?page=1&limit=20")
        .set("Cookie", validCookie);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockData);
      expect(productService.getProducts).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /api/v1/products", () => {
    it("should create a new product successfully", async () => {
      const newProduct = { id: 1, name: "New Product", barcode: "98765" };
      jest.spyOn(productService, "addProduct").mockResolvedValue(newProduct);

      const response = await request(app)
        .post("/api/v1/products")
        .set("Cookie", validCookie)
        .send({ name: "New Product", barcode: "98765" });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(productService.addProduct).toHaveBeenCalledWith({
        name: "New Product",
        barcode: "98765",
      });
    });

    it("should return 400 if product name is missing", async () => {
      const addSpy = jest.spyOn(productService, "addProduct");
      
      const response = await request(app)
        .post("/api/v1/products")
        .set("Cookie", validCookie)
        .send({ barcode: "98765" }); // نام ارسال نشده است

      expect(response.status).toBe(400);
      expect(addSpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // GET, PATCH, DELETE /api/v1/products/:productId
  // ==========================================
  describe("GET /api/v1/products/:productId", () => {
    it("should return a single product by ID", async () => {
      const mockProduct = { id: 1, name: "Product A" };
      jest.spyOn(productService, "getProduct").mockResolvedValue(mockProduct);

      const response = await request(app)
        .get("/api/v1/products/1")
        .set("Cookie", validCookie);

      expect(response.status).toBe(200);
      expect(productService.getProduct).toHaveBeenCalledWith(1); // ارسال عدد 1 به خاطر Joi
    });
  });

  describe("PATCH /api/v1/products/:productId", () => {
    it("should update an existing product", async () => {
      const updatedProduct = { id: 1, name: "Updated Name", salePrice: 50000 };
      jest.spyOn(productService, "updateProduct").mockResolvedValue(updatedProduct);

      const response = await request(app)
        .patch("/api/v1/products/1")
        .set("Cookie", validCookie)
        .send({ name: "Updated Name", salePrice: 50000 });

      expect(response.status).toBe(200);
      expect(productService.updateProduct).toHaveBeenCalledWith(1, {
        name: "Updated Name",
        salePrice: 50000,
      });
    });

    it("should return 400 if no fields are provided for update", async () => {
      const response = await request(app)
        .patch("/api/v1/products/1")
        .set("Cookie", validCookie)
        .send({}); // ابجکت خالی

      expect(response.status).toBe(400); // خطای object.min مربوط به Joi
    });
  });

  describe("DELETE /api/v1/products/:productId", () => {
    it("should delete a product successfully", async () => {
      jest.spyOn(productService, "deleteProduct").mockResolvedValue({ id: 1, name: "Deleted" });

      const response = await request(app)
        .delete("/api/v1/products/1")
        .set("Cookie", validCookie);

      expect(response.status).toBe(200);
      expect(productService.deleteProduct).toHaveBeenCalledWith(1);
    });
  });
});