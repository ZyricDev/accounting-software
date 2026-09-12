import request from "supertest";
import { jest } from "@jest/globals";
import app from "../src/app.js";
import purchaseCartService from "../src/modules/purchaseCart/purchaseCart.service.js";
import authRepository from "../src/modules/auth/auth.repository.js";
import jwt from "../src/shared/utils/jwt.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

describe("Purchase Cart Routes Integration Tests", () => {
  beforeEach(() => {
    jest.restoreAllMocks();

    // Bypassing Auth Middleware
    jest.spyOn(jwt, "verifyToken").mockReturnValue({ id: 1, tokenVersion: 1 });
    jest
      .spyOn(authRepository, "getAdmin")
      .mockResolvedValue({ id: 1, token_version: 1 });
  });

  const now = Date.now();
  const validCookie = [`token=valid_token; lastActivity=${now}`];

  // Base mock structure that includes the new profit calculation fields
  const mockEnrichedCart = {
    id: 1,
    items: [],
    subtotal: 0,
    totalQuantity: 0,
    discountAmount: 0,
    finalTotal: 0,
    totalExpectedProfit: 50000,
    finalExpectedProfit: 50000,
  };

  // ==========================================
  // Purchase Cart Core Routes
  // ==========================================
  describe("POST /api/v1/purchasesCart", () => {
    it("should create a new purchase cart successfully", async () => {
      jest
        .spyOn(purchaseCartService, "createCart")
        .mockResolvedValue(mockEnrichedCart);

      const response = await request(app)
        .post("/api/v1/purchasesCart")
        .set("Cookie", validCookie);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data.cart).toHaveProperty("finalExpectedProfit");
      expect(purchaseCartService.createCart).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/v1/purchasesCart", () => {
    it("should fetch the active purchase cart with profit fields", async () => {
      jest
        .spyOn(purchaseCartService, "getCart")
        .mockResolvedValue(mockEnrichedCart);

      const response = await request(app)
        .get("/api/v1/purchasesCart")
        .set("Cookie", validCookie);

      expect(response.status).toBe(200);
      expect(response.body.data.cart.totalExpectedProfit).toBe(50000);
      expect(purchaseCartService.getCart).toHaveBeenCalledTimes(1);
    });
  });

  describe("DELETE /api/v1/purchasesCart", () => {
    it("should delete the active purchase cart", async () => {
      jest.spyOn(purchaseCartService, "deleteCart").mockResolvedValue();

      const response = await request(app)
        .delete("/api/v1/purchasesCart")
        .set("Cookie", validCookie);

      expect(response.status).toBe(200);
      expect(purchaseCartService.deleteCart).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================
  // Purchase Cart Items Management
  // ==========================================
  describe("POST /api/v1/purchasesCart/items", () => {
    it("should add an item to the purchase cart", async () => {
      jest
        .spyOn(purchaseCartService, "addItem")
        .mockResolvedValue(mockEnrichedCart);

      const response = await request(app)
        .post("/api/v1/purchasesCart/items")
        .set("Cookie", validCookie)
        .send({ productId: 1 });

      expect(response.status).toBe(200);
      expect(purchaseCartService.addItem).toHaveBeenCalledWith(1);
    });

    it("should return 400 if productId is missing", async () => {
      const response = await request(app)
        .post("/api/v1/purchasesCart/items")
        .set("Cookie", validCookie)
        .send({}); // Missing productId

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/v1/purchasesCart/items", () => {
    it("should clear all items in the cart", async () => {
      jest
        .spyOn(purchaseCartService, "deleteItems")
        .mockResolvedValue(mockEnrichedCart);

      const response = await request(app)
        .delete("/api/v1/purchasesCart/items")
        .set("Cookie", validCookie);

      expect(response.status).toBe(200);
      expect(purchaseCartService.deleteItems).toHaveBeenCalledTimes(1);
    });
  });

  describe("DELETE /api/v1/purchasesCart/items/:itemId", () => {
    it("should delete a specific item", async () => {
      jest
        .spyOn(purchaseCartService, "deleteItem")
        .mockResolvedValue(mockEnrichedCart);

      const response = await request(app)
        .delete(`/api/v1/purchasesCart/items/${VALID_UUID}`)
        .set("Cookie", validCookie);

      expect(response.status).toBe(200);
      expect(purchaseCartService.deleteItem).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  // ==========================================
  // Item Updates (Quantity, Purchase Price, Sale Price)
  // ==========================================
  describe("PATCH /api/v1/purchasesCart/items/:itemId/quantity", () => {
    it("should update item quantity", async () => {
      jest
        .spyOn(purchaseCartService, "updateQuantityItemById")
        .mockResolvedValue(mockEnrichedCart);

      const response = await request(app)
        .patch(`/api/v1/purchasesCart/items/${VALID_UUID}/quantity`)
        .set("Cookie", validCookie)
        .send({ quantity: 10 });

      expect(response.status).toBe(200);
      expect(purchaseCartService.updateQuantityItemById).toHaveBeenCalledWith(
        VALID_UUID,
        10,
      );
    });
  });

  describe("PATCH /api/v1/purchasesCart/items/:itemId/purchase-price", () => {
    it("should update item purchase price", async () => {
      jest
        .spyOn(purchaseCartService, "updatePurchasePriceItemById")
        .mockResolvedValue(mockEnrichedCart);

      const response = await request(app)
        .patch(`/api/v1/purchasesCart/items/${VALID_UUID}/purchase-price`)
        .set("Cookie", validCookie)
        .send({ purchasePrice: 50000 });

      expect(response.status).toBe(200);
      expect(
        purchaseCartService.updatePurchasePriceItemById,
      ).toHaveBeenCalledWith(VALID_UUID, 50000);
    });

    it("should return 400 if purchasePrice is negative", async () => {
      const response = await request(app)
        .patch(`/api/v1/purchasesCart/items/${VALID_UUID}/purchase-price`)
        .set("Cookie", validCookie)
        .send({ purchasePrice: -500 });

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/v1/purchasesCart/items/:itemId/sale-price", () => {
    it("should update item sale price", async () => {
      jest
        .spyOn(purchaseCartService, "updateSalePriceItemById")
        .mockResolvedValue(mockEnrichedCart);

      const response = await request(app)
        .patch(`/api/v1/purchasesCart/items/${VALID_UUID}/sale-price`)
        .set("Cookie", validCookie)
        .send({ salePrice: 70000 });

      expect(response.status).toBe(200);
      expect(purchaseCartService.updateSalePriceItemById).toHaveBeenCalledWith(
        VALID_UUID,
        70000,
      );
    });
  });

  // ==========================================
  // Purchase Cart Discount Routes
  // ==========================================
  describe("POST /api/v1/purchasesCart/discount", () => {
    it("should apply discount to the cart", async () => {
      jest
        .spyOn(purchaseCartService, "applyDiscountToCart")
        .mockResolvedValue(mockEnrichedCart);

      const response = await request(app)
        .post("/api/v1/purchasesCart/discount")
        .set("Cookie", validCookie)
        .send({ discountAmount: 5000 });

      expect(response.status).toBe(200);
      expect(purchaseCartService.applyDiscountToCart).toHaveBeenCalledWith(
        5000,
      );
    });
  });

  describe("DELETE /api/v1/purchasesCart/discount", () => {
    it("should remove discount from the cart", async () => {
      jest
        .spyOn(purchaseCartService, "removeDiscountFromCart")
        .mockResolvedValue(mockEnrichedCart);

      const response = await request(app)
        .delete("/api/v1/purchasesCart/discount")
        .set("Cookie", validCookie);

      expect(response.status).toBe(200);
      expect(purchaseCartService.removeDiscountFromCart).toHaveBeenCalledTimes(
        1,
      );
    });
  });
});
