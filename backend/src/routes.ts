import { Router, Request, Response } from "express";
import {
  compareApiKey,
  authMiddleware,
  AuthRequest,
  generateApiKey,
  hashApiKey,
} from "./auth";
import {
  saveProductivity,
  getProductivityForDate,
  getProductivityRange,
  getProductivityStats,
  formatDate,
  getFirestore,
  getSystemLogs,
  updateUserPresence,
} from "./firebase";

const router = Router();

/**
 * GET /api/keys
 * List all API keys for authenticated user
 */
router.get(
  "/api/keys",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const db = getFirestore();
      const snapshot = await db
        .collection("users")
        .doc(userId!)
        .collection("apiKeys")
        .get();

      const keys = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          displayName: data.displayName,
          createdAt: data.createdAt,
          lastUsed: data.lastUsed,
          active: data.active,
        };
      });

      res.json({ success: true, keys });
    } catch (error) {
      console.error("Error fetching keys:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  },
);

/**
 * POST /api/keys/generate
 * Generate new API key
 */
router.post(
  "/api/keys/generate",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { displayName } = req.body;

      const rawKey = generateApiKey();
      const hashedKey = await hashApiKey(rawKey);

      const db = getFirestore();
      const keyData = {
        userId,
        key: hashedKey,
        displayName: displayName || "Unnamed Key",
        createdAt: new Date().toISOString(),
        active: true,
      };

      const docRef = await db
        .collection("users")
        .doc(userId!)
        .collection("apiKeys")
        .add(keyData);

      res.json({
        success: true,
        id: docRef.id,
        key: rawKey,
        message: "Keep this key safe! You will not see it again.",
      });
    } catch (error) {
      console.error("Error generating key:", error);
      res.status(500).json({ error: "Failed to generate API key" });
    }
  },
);

/**
 * DELETE /api/keys/:id
 * Revoke API key
 */
router.delete(
  "/api/keys/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const db = getFirestore();
      const docRef = db
        .collection("users")
        .doc(userId!)
        .collection("apiKeys")
        .doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Key not found" });
      }

      await docRef.delete();
      res.json({ success: true, message: "API key revoked" });
    } catch (error) {
      console.error("Error revoking key:", error);
      res.status(500).json({ error: "Failed to revoke API key" });
    }
  },
);

// Validate API key middleware
async function validateApiKey(req: Request): Promise<string | null> {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    return null;
  }

  try {
    // Search for the key in all users' collections
    const db = getFirestore();
    const snapshot = await db.collectionGroup("apiKeys").get();

    for (const doc of snapshot.docs) {
      const apiKeyData = doc.data();
      const isValid = await compareApiKey(apiKey, apiKeyData.key);

      if (isValid && apiKeyData.active) {
        // Update last used
        await doc.ref.update({ lastUsed: new Date().toISOString() });
        return apiKeyData.userId;
      }
    }

    return null;
  } catch (error) {
    console.error("API key validation error:", error);
    return null;
  }
}

/**
 * POST /api/productivity
 * Save productivity data for a user
 */
router.post("/api/productivity", async (req: Request, res: Response) => {
  try {
    // Validate API key
    const userId = await validateApiKey(req);
    if (!userId) {
      return res.status(401).json({ error: "Invalid or missing API key" });
    }

    const { date, source, activity, score, synced, isActive } = req.body;

    // Validate required fields
    if (!date || !activity || score === undefined) {
      return res.status(400).json({
        error: "Missing required fields: date, activity, score",
      });
    }

    // Save productivity data
    await saveProductivity(userId!, {
      date,
      source,
      activity,
      score,
      synced: synced !== undefined ? synced : true, // Use provided 'synced' or default to true
      syncedAt: new Date().toISOString(),
    });

    // Update user presence if provided
    if (typeof isActive === "boolean") {
      await updateUserPresence(userId!, isActive);
    }

    res.json({
      success: true,
      message: `Productivity data saved for ${date}`,
      userId,
    });
  } catch (error) {
    console.error("Error saving productivity:", error);
    res.status(500).json({ error: "Failed to save productivity data" });
  }
});

/**
 * GET /api/productivity?date=YYYY-MM-DD
 * Get productivity data for a specific date
 */
router.get("/api/productivity", async (req: Request, res: Response) => {
  try {
    // Validate API key
    const userId = await validateApiKey(req);
    if (!userId) {
      return res.status(401).json({ error: "Invalid or missing API key" });
    }

    const { date } = req.query;

    if (!date || typeof date !== "string") {
      return res
        .status(400)
        .json({ error: "Missing or invalid date parameter" });
    }

    const data = await getProductivityForDate(userId, date);

    if (!data) {
      return res.status(404).json({ error: "No data found for this date" });
    }

    res.json(data);
  } catch (error) {
    console.error("Error fetching productivity:", error);
    res.status(500).json({ error: "Failed to fetch productivity data" });
  }
});

/**
 * GET /api/productivity/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get productivity data for a date range
 */
router.get("/api/productivity/range", async (req: Request, res: Response) => {
  try {
    // Validate API key
    const userId = await validateApiKey(req);
    if (!userId) {
      return res.status(401).json({ error: "Invalid or missing API key" });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Missing startDate or endDate parameters" });
    }

    const data = await getProductivityRange(
      userId,
      String(startDate),
      String(endDate),
    );

    res.json({
      userId,
      startDate,
      endDate,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching productivity range:", error);
    res.status(500).json({ error: "Failed to fetch productivity data" });
  }
});

/**
 * GET /api/productivity/stats/me
 * Get productivity statistics for the authenticated user (JWT)
 */
router.get(
  "/api/productivity/stats/me",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const { days } = req.query;
      const daysNum = days ? parseInt(String(days), 10) : 30;

      const stats = await getProductivityStats(userId, daysNum);

      res.json({
        userId,
        period: `last ${daysNum} days`,
        ...stats,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  },
);

/**
 * GET /api/productivity/stats?days=30
 * Get productivity statistics for the last N days (API Key)
 */
router.get("/api/productivity/stats", async (req: Request, res: Response) => {
  try {
    // Validate API key
    const userId = await validateApiKey(req);
    if (!userId) {
      return res.status(401).json({ error: "Invalid or missing API key" });
    }

    const { days } = req.query;
    const daysNum = days ? parseInt(String(days), 10) : 30;

    const stats = await getProductivityStats(userId, daysNum);

    res.json({
      userId,
      period: `last ${daysNum} days`,
      ...stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/user/profile
 * Get current user profile settings
 */
router.get(
  "/api/user/profile",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const db = getFirestore();
      const doc = await db.collection("users").doc(userId!).get();

      if (!doc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = doc.data();
      res.json({
        success: true,
        profile: {
          username: userData?.username,
          email: userData?.email,
          dailyGoalHours: userData?.dailyGoalHours || 3,
        },
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  },
);

/**
 * PATCH /api/user/profile
 * Update user profile settings
 */
router.patch(
  "/api/user/profile",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { dailyGoalHours } = req.body;

      const db = getFirestore();
      await db.collection("users").doc(userId!).update({
        dailyGoalHours: dailyGoalHours,
        updatedAt: new Date().toISOString(),
      });

      res.json({ success: true, message: "Profile updated" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  },
);

/**
 * GET /api/system/logs
 * Get recent system logs for the authenticated user
 */
router.get(
  "/api/system/logs",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const logs = await getSystemLogs(userId!);
      res.json({ success: true, logs });
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ error: "Failed to fetch system logs" });
    }
  },
);

export default router;
