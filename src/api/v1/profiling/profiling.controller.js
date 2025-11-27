import { parseExpiryToMs } from "../../../utils/index.js";

export default {
  async createTemporaryUser(req, res, next) {
    const env = req.scope.resolve("env");
    try {
      const profilingService = req.scope.resolve("profilingService");
      const result = await profilingService.createTemporaryUser(req.body);
      // res.cookie("refreshToken", result.refreshToken, {
      //   httpOnly: true,
      //   secure: env.NODE_ENV === "production" || env.COOKIE_SECURE,
      //   sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
      //   maxAge: parseExpiryToMs(env.JWT_REFRESH_EXPIRES_IN),
      //   path: "/api/v1/auth",
      //   domain: env.COOKIE_DOMAIN,
      // });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
  async getQuestions(req, res, next) {
    try {
      const profilingService = req.scope.resolve("profilingService");
      const result = await profilingService.getQuestions();
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getCategories(req, res, next) {
    try {
      const profilingService = req.scope.resolve("profilingService");
      const result = await profilingService.getCategories();
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};