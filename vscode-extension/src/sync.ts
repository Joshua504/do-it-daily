import * as vscode from "vscode";
import { Storage, DailyActivity } from "./storage";
import { ActivityTracker } from "./tracker";

export class Syncer {
  private storage: Storage;
  private tracker: ActivityTracker;
  private syncInterval: any = null;

  constructor(storage: Storage, tracker: ActivityTracker) {
    this.storage = storage;
    this.tracker = tracker;
  }

  start(): void {
    const config = vscode.workspace.getConfiguration("productivityTracker");
    const syncIntervalSeconds = config.get<number>("syncInterval", 3600);

    console.log(
      `[Syncer] Starting sync with interval: ${syncIntervalSeconds}s`,
    );

    // Sync immediately on startup
    this.syncNow();

    // Then set up interval
    this.syncInterval = setInterval(() => {
      this.syncNow();
    }, syncIntervalSeconds * 1000);
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log("[Syncer] Stopped");
  }

  async syncNow(): Promise<boolean> {
    const config = vscode.workspace.getConfiguration("productivityTracker");
    const backendUrl = config.get<string>(
      "backendUrl",
      "http://localhost:3000",
    );

    const unsyncedData = await this.storage.getUnsyncedData();

    if (unsyncedData.length === 0) {
      console.log("[Syncer] No data to sync");
      return true;
    }

    try {
      console.log(`[Syncer] Syncing ${unsyncedData.length} records...`);

      for (const activity of unsyncedData) {
        const success = await this.sendToBackend(backendUrl, activity);
        if (success) {
          await this.storage.markSynced(activity.date);
          console.log(`[Syncer] Synced: ${activity.date}`);
        } else {
          console.warn(`[Syncer] Failed to sync: ${activity.date}`);
        }
      }

      return true;
    } catch (error) {
      console.error("[Syncer] Sync failed:", error);
      return false;
    }
  }

  private async sendToBackend(
    backendUrl: string,
    activity: DailyActivity,
  ): Promise<boolean> {
    const config = vscode.workspace.getConfiguration("productivityTracker");
    const apiKey = config.get<string>("apiKey");

    if (!apiKey) {
      console.error("[Syncer] No API key configured");
      return false;
    }

    try {
      const response = await fetch(`${backendUrl}/api/productivity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          ...activity,
          isActive: !this.tracker.isCurrentlyIdle(),
        }),
      });

      if (response.status === 401) {
        vscode.window
          .showErrorMessage(
            "🔒 Productivity Tracker: Invalid or missing API Key. Please update it in settings.",
            "Open Settings",
          )
          .then((selection) => {
            if (selection === "Open Settings") {
              vscode.env.openExternal(
                vscode.Uri.parse("http://localhost:5173/settings"),
              );
            }
          });
        return false;
      }

      if (!response.ok) {
        console.error(
          `[Syncer] Backend error: ${response.status} ${response.statusText}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("[Syncer] Network error:", error);
      return false;
    }
  }

  async showStats(): Promise<void> {
    const activity = await this.storage.getToday();

    if (!activity) {
      vscode.window.showInformationMessage("No activity tracked today");
      return;
    }

    const stats = `
📊 Today's Productivity Stats

📝 Files Edited: ${activity.activity.filesEdited}
📄 Lines Changed: ${activity.activity.linesChanged}
⏱️  Time Spent: ${activity.activity.timeSpent} minutes
📈 Productivity Score: ${activity.score}/100
🔄 Synced: ${activity.synced ? "✓ Yes" : "✗ No"}
    `.trim();

    vscode.window.showInformationMessage(stats);
  }
}
