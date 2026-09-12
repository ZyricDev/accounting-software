import request from "supertest";
import { jest } from "@jest/globals";
import app from "../src/app.js";
import authService from "../src/modules/auth/auth.service.js";
import authRepository from "../src/modules/auth/auth.repository.js"; // <--- اضافه شدن ریپازیتوری
import jwt from "../src/shared/utils/jwt.js";

describe("Auth Routes Integration Tests", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================
  // Login Route Tests
  // ==========================================
  describe("POST /api/v1/auth/login", () => {
    it("should login successfully with valid credentials and set cookies", async () => {
      jest.spyOn(authService, "login").mockResolvedValue("mocked_jwt_token");

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: "admin", password: "password123" });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });

    it("should return 400 validation error if password is missing", async () => {
      const loginSpy = jest.spyOn(authService, "login");
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: "admin" });

      expect(response.status).toBe(400);
      expect(loginSpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // Change Password Route Tests
  // ==========================================
  describe("POST /api/v1/auth/change-password", () => {
    it("should successfully change the password and clear cookies", async () => {
      jest.spyOn(jwt, "verifyToken").mockReturnValue({ id: 1, tokenVersion: 1 });
      
      // دور زدن دیتابیس در میدلور
      jest.spyOn(authRepository, "getAdmin").mockResolvedValue({ id: 1, token_version: 1 });
      jest.spyOn(authService, "changePassword").mockResolvedValue();

      // استفاده از زمان حال برای جلوگیری از خطای منقضی شدن نشست
      const now = Date.now(); 

      const response = await request(app)
        .post("/api/v1/auth/change-password")
        .set("Cookie", [`token=valid_token; lastActivity=${now}`])
        .send({
          oldPassword: "oldPassword123",
          newPassword: "newPassword123",
          confirmPassword: "newPassword123",
        });

      expect(response.status).toBe(200);
      expect(authService.changePassword).toHaveBeenCalledWith("oldPassword123", "newPassword123");
    });
  });

  // ==========================================
  // Logout Route Tests
  // ==========================================
  describe("DELETE /api/v1/auth/logout", () => {
    it("should logout the admin successfully and clear session cookies", async () => {
      jest.spyOn(authService, "logoutAdmin").mockResolvedValue();

      const response = await request(app)
        .delete("/api/v1/auth/logout")
        .set("Cookie", ["token=valid_token"]);

      expect(response.status).toBe(200);
    });
  });

  // ==========================================
  // Check Auth Route Tests
  // ==========================================
  describe("GET /api/v1/auth/check", () => {
    it("should return status 200 if the provided token is valid", async () => {
      jest.spyOn(jwt, "verifyToken").mockReturnValue({ id: 1, tokenVersion: 1 });
      jest.spyOn(authRepository, "getAdmin").mockResolvedValue({ id: 1, token_version: 1 });

      const now = Date.now();

      const response = await request(app)
        .get("/api/v1/auth/check")
        .set("Cookie", [`token=valid_token; lastActivity=${now}`]);

      expect(response.status).toBe(200);
    });

    it("should return 401 unauthorized if no token is provided", async () => {
      const response = await request(app).get("/api/v1/auth/check");
      expect(response.status).toBe(401);
    });
  });
});