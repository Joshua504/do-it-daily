import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

let db: FirebaseFirestore.Firestore;

export function initializeFirebase(): void {
  try {
    if (!admin.apps.length) {
      let credential;

      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        console.log(
          "✓ Using Firebase Service Account from environment variable",
        );
        credential = admin.credential.cert(
          JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT),
        );
      } else {
        console.log("✓ Using Firebase Service Account from local JSON file");
        // Import service account explicitly for local dev
        const serviceAccountPath = path.resolve(
          __dirname,
          "../serviceAccountKey.json",
        );
        const serviceAccount = require(serviceAccountPath);
        credential = admin.credential.cert(serviceAccount);
      }

      admin.initializeApp({
        credential,
      });
    }

    db = admin.firestore();
    console.log("✓ Firebase initialized");
  } catch (error) {
    console.error("✗ Firebase initialization failed:", error);
    throw error;
  }
}

export function getFirestore(): FirebaseFirestore.Firestore {
  if (!db) {
    throw new Error("Firebase not initialized");
  }
  return db;
}

// User interface
export interface User {
  userId: string;
  username: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
  dailyGoalHours: number;
  lastPulseAt?: string;
  isCurrentlyActive?: boolean;
  github?: {
    id: string;
    username: string;
    avatar: string;
  };
}

export async function updateUserPresence(
  userId: string,
  isActive: boolean,
): Promise<void> {
  const db = getFirestore();
  await db.collection("users").doc(userId).update({
    isCurrentlyActive: isActive,
    lastPulseAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

// API Key interface
export interface ApiKey {
  userId: string;
  key: string;
  displayName: string;
  createdAt: string;
  lastUsed?: string;
  active: boolean;
}

// Create or get user
export async function createUser(
  userId: string,
  username: string,
  email: string,
  passwordHash: string,
): Promise<User> {
  const db = getFirestore();
  const now = new Date().toISOString();

  const user: User = {
    userId,
    username,
    email,
    password: passwordHash,
    createdAt: now,
    updatedAt: now,
    dailyGoalHours: 3,
  };

  await db.collection("users").doc(userId).set(user);
  return user;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getFirestore();
  const snapshot = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as User;
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  const db = getFirestore();
  const doc = await db.collection("users").doc(userId).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as User;
}

// Update user
export async function updateUser(
  userId: string,
  updates: Partial<User>,
): Promise<void> {
  const db = getFirestore();
  await db
    .collection("users")
    .doc(userId)
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
}

export interface UserProductivity {
  userId: string;
  date: string;
  source: string;
  score: number;
  synced: boolean;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
  activity: {
    filesEdited: number;
    linesChanged: number;
    timeSpent: number;
    commits?: number;
    repos?: Record<
      string,
      {
        filesEdited: number;
        linesChanged: number;
        timeSpent: number;
        lastActive: string;
      }
    >;
  };
}

export async function saveProductivity(
  userId: string,
  data: Omit<UserProductivity, "userId" | "createdAt" | "updatedAt">,
): Promise<void> {
  const db = getFirestore();
  const docRef = db
    .collection("users")
    .doc(userId)
    .collection("productivity")
    .doc(data.date);

  const now = new Date().toISOString();

  await docRef.set({
    ...data,
    userId,
    createdAt: now,
    updatedAt: now,
  });

  // Log sync event
  await addSystemLog(userId, `Data synchronized for ${data.date}`, "sync");
}

export interface SystemLog {
  id?: string;
  userId: string;
  message: string;
  type: "sync" | "auth" | "error" | "info";
  timestamp: string;
}

export async function addSystemLog(
  userId: string,
  message: string,
  type: SystemLog["type"] = "info",
): Promise<void> {
  const db = getFirestore();
  const log: SystemLog = {
    userId,
    message,
    type,
    timestamp: new Date().toISOString(),
  };
  await db.collection("users").doc(userId).collection("logs").add(log);
}

export async function getSystemLogs(
  userId: string,
  limit: number = 10,
): Promise<SystemLog[]> {
  const db = getFirestore();
  const snapshot = await db
    .collection("users")
    .doc(userId)
    .collection("logs")
    .orderBy("timestamp", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as SystemLog,
  );
}

export async function getProductivityForDate(
  userId: string,
  date: string,
): Promise<UserProductivity | null> {
  const db = getFirestore();
  const doc = await db
    .collection("users")
    .doc(userId)
    .collection("productivity")
    .doc(date)
    .get();

  return doc.exists ? (doc.data() as UserProductivity) : null;
}

export async function getProductivityRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<UserProductivity[]> {
  const db = getFirestore();
  const snapshot = await db
    .collection("users")
    .doc(userId)
    .collection("productivity")
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .orderBy("date", "asc")
    .get();

  return snapshot.docs.map((doc) => doc.data() as UserProductivity);
}

export async function getProductivityStats(
  userId: string,
  days: number = 30,
): Promise<any> {
  const db = getFirestore();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = formatDate(startDate);

  const snapshot = await db
    .collection("users")
    .doc(userId)
    .collection("productivity")
    .where("date", ">=", startDateStr)
    .orderBy("date", "desc")
    .get();

  const data = snapshot.docs.map((doc) => doc.data() as UserProductivity);

  if (data.length === 0) {
    return {
      totalDays: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      totalFilesEdited: 0,
      totalLinesChanged: 0,
      bestScore: 0,
      streak: 0,
      dailyGoalHours: 3,
    };
  }

  const totalTimeSpent = data.reduce((sum, d) => sum + d.activity.timeSpent, 0);
  const totalFilesEdited = data.reduce(
    (sum, d) => sum + d.activity.filesEdited,
    0,
  );
  const totalLinesChanged = data.reduce(
    (sum, d) => sum + d.activity.linesChanged,
    0,
  );
  const totalContributions = data.reduce(
    (sum, d) => sum + (d.activity.filesEdited || 0) + (d.activity.commits || 0),
    0,
  );
  const averageScore = Math.round(
    data.reduce((sum, d) => sum + d.score, 0) / data.length,
  );
  const bestScore = Math.max(...data.map((d) => d.score));

  // Calculate streaks
  // Sort by date ascending to iterate
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  const todayStr = formatDate(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  for (const record of sortedData) {
    if (record.activity.timeSpent > 0) {
      if (!lastDate) {
        tempStreak = 1;
      } else {
        const diffTime = new Date(record.date).getTime() - lastDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      lastDate = new Date(record.date);
      longestStreak = Math.max(longestStreak, tempStreak);
    }
  }

  // Current streak only counts if active today or yesterday
  const lastActiveDateStr = lastDate ? formatDate(lastDate) : "";
  if (lastActiveDateStr === todayStr || lastActiveDateStr === yesterdayStr) {
    currentStreak = tempStreak;
  } else {
    currentStreak = 0;
  }

  // Get user for daily goal
  const user = await getUserById(userId);

  return {
    totalDays: data.length,
    totalContributions,
    averageScore,
    totalTimeSpent,
    totalFilesEdited,
    totalLinesChanged,
    bestScore,
    currentStreak,
    longestStreak,
    dailyGoalHours: user?.dailyGoalHours || 3,
    isCurrentlyActive: user?.isCurrentlyActive || false,
    recentData: data.slice(0, 30),
    topRepos: calculateTopRepos(data),
  };
}

function calculateTopRepos(data: UserProductivity[]): any[] {
  const repoMap: Record<string, any> = {};

  data.forEach((day) => {
    if (day.activity.repos) {
      Object.entries(day.activity.repos).forEach(([name, stats]) => {
        if (!repoMap[name]) {
          repoMap[name] = {
            name,
            filesEdited: 0,
            linesChanged: 0,
            timeSpent: 0,
          };
        }
        repoMap[name].filesEdited += stats.filesEdited;
        repoMap[name].linesChanged += stats.linesChanged;
        repoMap[name].timeSpent += stats.timeSpent;
      });
    }
  });

  return Object.values(repoMap)
    .sort((a, b) => b.timeSpent - a.timeSpent)
    .slice(0, 5);
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
