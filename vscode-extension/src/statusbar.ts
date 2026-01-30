import * as vscode from "vscode";
import { Storage } from "./storage";

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private updateInterval: any = null;
  private blinkInterval: any = null;
  private storage: Storage;
  private sessionStartTime: number = Date.now();
  private lastActivityTime: number = Date.now();
  private isActive: boolean = true;
  private blinkState: boolean = true;
  private readonly IDLE_TIMEOUT = 1 * 60 * 1000; // 1 minute

  constructor(storage: Storage) {
    this.storage = storage;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.statusBarItem.name = "Productivity Tracker";
  }

  show(): void {
    this.statusBarItem.show();
    this.startUpdating();
    this.startBlinking();
    this.trackActivity();
  }

  hide(): void {
    this.statusBarItem.hide();
    this.stopUpdating();
    this.stopBlinking();
  }

  private startUpdating(): void {
    // Update every second
    this.updateInterval = setInterval(() => {
      this.updateStatusBar();
    }, 1000);

    // Initial update
    this.updateStatusBar();
  }

  private stopUpdating(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private startBlinking(): void {
    // Blink every 500ms
    this.blinkInterval = setInterval(async () => {
      this.blinkState = !this.blinkState;
      await this.updateDot();
    }, 500);
  }

  private stopBlinking(): void {
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }
  }

  private trackActivity(): void {
    // Track file changes, saves, and editor changes as activity
    vscode.workspace.onDidSaveTextDocument(() => {
      this.lastActivityTime = Date.now();
      this.isActive = true;
    });

    vscode.workspace.onDidChangeTextDocument(() => {
      this.lastActivityTime = Date.now();
      this.isActive = true;
    });

    vscode.window.onDidChangeActiveTextEditor(() => {
      this.lastActivityTime = Date.now();
      this.isActive = true;
    });

    // Check for idle every 10 seconds
    setInterval(() => {
      const timeSinceLastActivity = Date.now() - this.lastActivityTime;
      const wasActive = this.isActive;
      this.isActive = timeSinceLastActivity < this.IDLE_TIMEOUT;

      if (wasActive !== this.isActive) {
        this.updateDot();
      }
    }, 10000);
  }

  private async updateDot(): Promise<void> {
    const activity = await this.storage.getToday();

    let timeStr = "00:00";
    if (activity) {
      const totalSeconds = activity.activity.timeSpent;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      const h = hours.toString().padStart(2, "0");
      const m = minutes.toString().padStart(2, "0");
      timeStr = `${h}:${m}`;
    }

    // Only dot blinks: ● → _ → ●
    const blinkDot = this.blinkState ? "●" : " ";
    const dotColor = this.isActive ? "#4ec9b0" : "#d43535"; // green when active, red when idle

    this.statusBarItem.text = `${blinkDot} ${timeStr}`;
    this.statusBarItem.color = dotColor;
  }

  private async updateStatusBar(): Promise<void> {
    const activity = await this.storage.getToday();

    if (!activity) {
      const dot = this.blinkState ? "●" : "◯";
      this.statusBarItem.tooltip = `Productivity Tracker
━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 Active (Green) / 🔴 Idle (Red)
No activity tracked yet today.`;
      return;
    }

    const totalSeconds = activity.activity.timeSpent;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const timeStr = this.formatTime(hours, minutes, seconds);
    const scoreStr = activity.score;

    this.statusBarItem.tooltip = `
📊 Productivity Tracker Stats
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  Time Spent: ${timeStr}
📝 Files Edited: ${activity.activity.filesEdited}
📄 Lines Changed: ${activity.activity.linesChanged}
📈 Productivity Score: ${scoreStr}/100
🔄 Synced: ${activity.synced ? "✓ Yes" : "✗ No"}

Status: ${this.isActive ? "🟢 Active" : "🔴 Idle"}
    `.trim();

    // Show command when clicked
    this.statusBarItem.command = "productivity.showStats";
  }

  private formatTime(hours: number, minutes: number, seconds: number): string {
    const h = String(hours).padStart(2, "0");
    const m = String(minutes).padStart(2, "0");
    const s = String(seconds).padStart(2, "0");

    if (hours > 0) {
      return `${h}h ${m}m ${s}s`;
    } else if (minutes > 0) {
      return `${m}m ${s}s`;
    } else {
      return `${s}s`;
    }
  }

  private getSessionSeconds(): number {
    const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    return elapsed % 60;
  }

  resetSession(): void {
    this.sessionStartTime = Date.now();
  }

  dispose(): void {
    this.stopUpdating();
    this.statusBarItem.dispose();
  }
}
