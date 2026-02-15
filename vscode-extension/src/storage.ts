import * as vscode from "vscode";
import { promises as fs } from "fs";
import * as path from "path";

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  source: "vscode";
  activity: {
    filesEdited: number;
    linesChanged: number;
    timeSpent: number; // seconds
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
  score: number; // 0-100
  synced?: boolean;
  syncedAt?: string;
}

export class Storage {
  private dataDir: string;
  private dataFile: string;
  private cache: DailyActivity[] | null = null;
  private isWriting: boolean = false;

  constructor(globalStoragePath: string) {
    this.dataDir = globalStoragePath;
    this.dataFile = path.join(this.dataDir, "productivity.json");
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      // Create file if it doesn't exist
      try {
        await fs.access(this.dataFile);
      } catch {
        await fs.writeFile(this.dataFile, JSON.stringify([], null, 2));
      }
    } catch (error) {
      console.error("Storage initialization error:", error);
    }
  }

  async getToday(): Promise<DailyActivity | null> {
    const today = this.getTodayDate();
    const all = await this.getAll();
    const existing = all.find((a) => a.date === today);
    return existing ? JSON.parse(JSON.stringify(existing)) : null; // Return a copy
  }

  async getTodayOrCreate(): Promise<DailyActivity> {
    const existing = await this.getToday();
    if (existing) {
      return existing;
    }

    const newActivity: DailyActivity = {
      date: this.getTodayDate(),
      source: "vscode",
      activity: {
        filesEdited: 0,
        linesChanged: 0,
        timeSpent: 0,
        commits: 0,
      },
      score: 0,
      synced: false,
    };

    await this.save(newActivity);
    return newActivity;
  }

  async save(activity: DailyActivity): Promise<void> {
    const all = await this.getAll();
    const index = all.findIndex((a) => a.date === activity.date);

    const activityCopy = JSON.parse(JSON.stringify(activity));

    // Always mark as unsynced when saving new activity
    activityCopy.synced = false;

    if (index >= 0) {
      all[index] = activityCopy;
    } else {
      all.push(activityCopy);
    }

    this.cache = all; // Update cache immediately
    await this.writeFile(all);
  }

  async getAll(): Promise<DailyActivity[]> {
    if (this.cache) {
      return this.cache;
    }

    try {
      const data = await fs.readFile(this.dataFile, "utf-8");
      this.cache = JSON.parse(data);
      return this.cache || [];
    } catch (error) {
      // If file is empty or missing, return empty array but don't cache null
      return [];
    }
  }

  async getUnsyncedData(): Promise<DailyActivity[]> {
    const all = await this.getAll();
    return all.filter((a) => !a.synced);
  }

  async markSynced(date: string): Promise<void> {
    const all = await this.getAll();
    const activity = all.find((a) => a.date === date);
    if (activity) {
      activity.synced = true;
      activity.syncedAt = new Date().toISOString();
      await this.writeFile(all);
    }
  }

  async clear(): Promise<void> {
    await this.writeFile([]);
  }

  private async writeFile(data: DailyActivity[]): Promise<void> {
    try {
      await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error writing to storage:", error);
    }
  }

  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
