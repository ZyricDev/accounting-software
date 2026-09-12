import request from "supertest";
import { jest } from "@jest/globals";
import app from "../src/app.js";
import cartService from "../src/modules/cart/cart.service.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

describe("Cart Routes Integration Tests", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("POST /api/v1/carts", () => {
    it("should create a new cart successfully", async () => {
      jest.spyOn(cartService, "createCart").mockResolvedValue({ id: 1, items: [], discountAmount: 0 });

      const response = await request(app).post("/api/v1/carts");

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(cartService.createCart).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/v1/carts", () => {
    it("should return a list of active carts", async () => {
      jest.spyOn(cartService, "getCarts").mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const response = await request(app).get("/api/v1/carts");

      expect(response.status).toBe(200);
      expect(response.body.data.carts.length).toBe(2);
    });
  });

  describe("GET /api/v1/carts/products/search", () => {
    it("should return search results for valid query", async () => {
      jest.spyOn(cartService, "searchProducts").mockResolvedValue([{ id: 1, name: "Product A" }]);

      const response = await request(app).get("/api/v1/carts/products/search?q=test");

      expect(response.status).toBe(200);
      expect(cartService.searchProducts).toHaveBeenCalledWith("test");
    });

    it("should return 400 if search query 'q' is missing", async () => {
      const searchSpy = jest.spyOn(cartService, "searchProducts");
      const response = await request(app).get("/api/v1/carts/products/search");

      expect(response.status).toBe(400);
      expect(searchSpy).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/carts/:cartId/items", () => {
    it("should add an item to the cart", async () => {
      jest.spyOn(cartService, "addItem").mockResolvedValue({ id: 1, items: [{ productId: 1, quantity: 2 }] });

      const response = await request(app)
        .post("/api/v1/carts/1/items")
        .send({ productId: 1, quantity: 2 });

      expect(response.status).toBe(200);
      // تغییر به عدد 1
      expect(cartService.addItem).toHaveBeenCalledWith(1, { productId: 1, quantity: 2 });
    });

    it("should return 400 if productId is missing or invalid", async () => {
      const addItemSpy = jest.spyOn(cartService, "addItem");
      const response = await request(app)
        .post("/api/v1/carts/1/items")
        .send({ quantity: 2 }); 

      expect(response.status).toBe(400);
      expect(addItemSpy).not.toHaveBeenCalled();
    });
  });

  describe("PATCH /api/v1/carts/:cartId/items/:itemId/quantity", () => {
    it("should update the item quantity", async () => {
      jest.spyOn(cartService, "updateQuantityItemById").mockResolvedValue({ id: 1 });

      const response = await request(app)
        .patch(`/api/v1/carts/1/items/${VALID_UUID}/quantity`)
        .send({ quantity: 5 });

      expect(response.status).toBe(200);
      expect(cartService.updateQuantityItemById).toHaveBeenCalledWith({
        cartId: 1, // تغییر به عدد 1
        itemId: VALID_UUID,
        quantity: 5,
      });
    });

    it("should return 400 if itemId is not a valid UUID", async () => {
      const response = await request(app)
        .patch(`/api/v1/carts/1/items/invalid-uuid/quantity`)
        .send({ quantity: 5 });

      expect(response.status).toBe(400); 
    });
  });

  describe("PATCH /api/v1/carts/:cartId/items/:itemId/price", () => {
    it("should update the item sale price", async () => {
      jest.spyOn(cartService, "updateSalePriceItemById").mockResolvedValue({ id: 1 });

      const response = await request(app)
        .patch(`/api/v1/carts/1/items/${VALID_UUID}/price`)
        .send({ salePrice: 15000 });

      expect(response.status).toBe(200);
      expect(cartService.updateSalePriceItemById).toHaveBeenCalledWith({
        cartId: 1, // تغییر به عدد 1
        itemId: VALID_UUID,
        salePrice: 15000,
      });
    });
  });

  describe("DELETE /api/v1/carts/:cartId/items/:itemId", () => {
    it("should delete a specific item from the cart", async () => {
      jest.spyOn(cartService, "deleteItemById").mockResolvedValue({ id: 1 });

      const response = await request(app).delete(`/api/v1/carts/1/items/${VALID_UUID}`);

      expect(response.status).toBe(200);
      expect(cartService.deleteItemById).toHaveBeenCalledWith({ cartId: 1, itemId: VALID_UUID }); // تغییر به عدد 1
    });
  });

  describe("DELETE /api/v1/carts/:cartId/items", () => {
    it("should clear all items in the cart", async () => {
      jest.spyOn(cartService, "clearCartItems").mockResolvedValue({ id: 1, items: [] });

      const response = await request(app).delete("/api/v1/carts/1/items");

      expect(response.status).toBe(200);
      expect(cartService.clearCartItems).toHaveBeenCalledWith(1); // تغییر به عدد 1
    });
  });

  describe("POST /api/v1/carts/:cartId/discount", () => {
    it("should apply discount to the cart", async () => {
      jest.spyOn(cartService, "applyDiscount").mockResolvedValue({ id: 1, discountAmount: 1000 });

      const response = await request(app)
        .post("/api/v1/carts/1/discount")
        .send({ discountAmount: 1000 });

      expect(response.status).toBe(200);
      expect(cartService.applyDiscount).toHaveBeenCalledWith(1, 1000); // تغییر به عدد 1
    });

    it("should return 400 if discount amount is negative", async () => {
      const applySpy = jest.spyOn(cartService, "applyDiscount");
      const response = await request(app)
        .post("/api/v1/carts/1/discount")
        .send({ discountAmount: -500 }); 

      expect(response.status).toBe(400);
      expect(applySpy).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/v1/carts/:cartId/discount", () => {
    it("should remove the discount from the cart", async () => {
      jest.spyOn(cartService, "removeDiscount").mockResolvedValue({ id: 1, discountAmount: 0 });

      const response = await request(app).delete("/api/v1/carts/1/discount");

      expect(response.status).toBe(200);
      expect(cartService.removeDiscount).toHaveBeenCalledWith(1); // تغییر به عدد 1
    });
  });
});