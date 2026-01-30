import * as vscode from "vscode";
import { Storage, DailyActivity } from "./storage";
import { ActivityTracker } from "./tracker";
import { Logger } from "./logger";

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
    const syncIntervalSeconds = config.get<number>("syncInterval", 60);

    Logger.log(`[Syncer] Starting sync with interval: ${syncIntervalSeconds}s`);

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
      "https://productivity-backend-31s3.onrender.com",
    );

    Logger.log(`[Syncer] Starting sync... (URL: ${backendUrl})`);

    const unsyncedData = await this.storage.getUnsyncedData();

    if (unsyncedData.length === 0) {
      Logger.log("[Syncer] No data to sync");
      return true;
    }

    try {
      Logger.log(`[Syncer] Syncing ${unsyncedData.length} records...`);

      for (const activity of unsyncedData) {
        const success = await this.sendToBackend(backendUrl, activity);
        if (success) {
          await this.storage.markSynced(activity.date);
          Logger.log(`[Syncer] Synced: ${activity.date}`);
        } else {
          Logger.log(`[Syncer] Failed to sync: ${activity.date}`);
        }
      }

      return true;
    } catch (error) {
      Logger.error("Sync failed", error);
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
      Logger.error(
        "[Syncer] No API key configured. Please obtain one from your dashboard settings.",
      );
      return false;
    }

    try {
      Logger.log(
        `[Syncer] Sending data for ${activity.date} to ${backendUrl}...`,
      );
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
        Logger.error("[Syncer] Unauthorized: Invalid API Key");
        vscode.window
          .showErrorMessage(
            "🔒 Productivity Tracker: Invalid or missing API Key. Please update it in settings.",
            "Open Settings",
          )
          .then((selection) => {
            if (selection === "Open Settings") {
              const dashboardUrl =
                "https://productivity-dashboard-live.onrender.com/settings"; // Replace with real if known, or fallback
              vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
            }
          });
        return false;
      }

      if (!response.ok) {
        Logger.error(
          `[Syncer] Backend error: ${response.status} ${response.statusText}`,
        );
        return false;
      }

      Logger.log(`[Syncer] Successfully sent data for ${activity.date}`);
      return true;
    } catch (error) {
      Logger.error("[Syncer] Network error during sendToBackend", error);
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
