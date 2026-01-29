import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateApiKey,
  hashApiKey,
  compareApiKey,
  authMiddleware,
  AuthRequest,
} from "./auth";
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  getFirestore,
} from "./firebase";

const debugLogPath = path.resolve(__dirname, "../auth_debug.log");
const appendToLog = (msg: string) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(debugLogPath, `${timestamp} - ${msg}\n`);
};

const router = Router();

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post("/api/auth/signup", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = uuidv4();
    await createUser(userId, username, email, passwordHash);

    // Generate token
    const token = generateToken(userId);

    res.json({
      success: true,
      message: "Account created successfully",
      token,
      userId,
      user: { username, email },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Signup failed" });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    // Get user
    appendToLog(`[AUTH] Login attempt for: ${email}`);
    const user = await getUserByEmail(email);
    if (!user) {
      appendToLog(`[AUTH] Failure: User not found for ${email}`);
      return res
        .status(401)
        .json({ error: "Invalid email or password", debug: "USER_NOT_FOUND" });
    }

    appendToLog(`[AUTH] User found: ${user.userId}. Comparing passwords...`);

    // Compare password
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      appendToLog(`[AUTH] Failure: Password mismatch for ${email}`);
      return res
        .status(401)
        .json({
          error: "Invalid email or password",
          debug: "PASSWORD_MISMATCH",
        });
    }

    appendToLog(`[AUTH] Success: Login authorized for ${email}`);

    // Generate token
    const token = generateToken(user.userId);

    res.json({
      success: true,
      message: "Login successful",
      token,
      userId: user.userId,
      user: { username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * POST /api/auth/validate
 * Validate token
 */
router.post("/api/auth/validate", (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    res.json({
      success: true,
      userId: decoded.userId,
    });
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(500).json({ error: "Validation failed" });
  }
});

/**
 * GET /api/auth/user
 * Get current user info
 */
router.get(
  "/api/auth/user",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await getUserById(req.userId!);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't return password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  },
);

export default router;
