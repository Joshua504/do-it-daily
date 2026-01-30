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
    return all.find((a) => a.date === today) || null;
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

    if (index >= 0) {
      all[index] = activity;
    } else {
      all.push(activity);
    }

    await this.writeFile(all);
  }

  async getAll(): Promise<DailyActivity[]> {
    try {
      const data = await fs.readFile(this.dataFile, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading storage:", error);
      return [];
    }
  }

  async getUnsyncedData(): Promise<DailyActivity[]> {
    const all = await this.getAll();
    return all.filter((a) => !a.synced);
  }

  async markSynced(date: string): Promise<void> {
    const activity = await this.getToday();
    if (activity) {
      activity.synced = true;
      activity.syncedAt = new Date().toISOString();
      await this.save(activity);
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
