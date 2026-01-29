import * as vscode from "vscode";
import { Storage, DailyActivity } from "./storage";

export class ActivityTracker {
  private storage: Storage;
  private lastSaveTime: number = Date.now();
  private activeEditorStartTime: number = Date.now();
  private editorChangeListener: vscode.Disposable | null = null;
  private saveListener: vscode.Disposable | null = null;
  private changeListener: vscode.Disposable | null = null;
  private selectionListener: vscode.Disposable | null = null;
  private lastInteractionTime: number = Date.now();
  private readonly IDLE_THRESHOLD = 2 * 60 * 1000; // 2 minutes in ms

  constructor(storage: Storage) {
    this.storage = storage;
  }

  async start(): Promise<void> {
    console.log("[Tracker] Starting activity tracking...");

    // Track file saves
    this.saveListener = vscode.workspace.onDidSaveTextDocument((document) => {
      this.onFileSaved(document);
    });

    // Track file changes (content modifications)
    this.changeListener = vscode.workspace.onDidChangeTextDocument((event) => {
      this.onFileChanged(event);
    });

    // Track active editor selection changes (cursor movement)
    this.selectionListener = vscode.window.onDidChangeTextEditorSelection(
      () => {
        this.lastInteractionTime = Date.now();
      },
    );

    // Track active editor time
    this.editorChangeListener = vscode.window.onDidChangeActiveTextEditor(
      () => {
        this.activeEditorStartTime = Date.now();
        this.lastInteractionTime = Date.now();
      },
    );

    // Initialize today's activity
    await this.storage.getTodayOrCreate();
  }

  stop(): void {
    console.log("[Tracker] Stopping activity tracking...");
    this.saveListener?.dispose();
    this.changeListener?.dispose();
    this.editorChangeListener?.dispose();
  }

  private async onFileSaved(document: vscode.TextDocument): Promise<void> {
    if (this.isExcludedFile(document.uri.fsPath)) {
      return;
    }

    const activity = await this.storage.getTodayOrCreate();
    const repoName = this.getRepoName(document.uri);
    this.lastInteractionTime = Date.now();

    // Increment global and repo-specific files edited
    activity.activity.filesEdited += 1;
    this.updateRepoStats(activity, repoName, { filesEdited: 1 });

    // Update score based on activity
    activity.score = this.calculateScore(activity.activity);

    await this.storage.save(activity);

    console.log(
      `[Tracker] File saved: ${document.fileName} (Repo: ${repoName})`,
    );
  }

  private async onFileChanged(
    event: vscode.TextDocumentChangeEvent,
  ): Promise<void> {
    if (this.isExcludedFile(event.document.uri.fsPath)) {
      return;
    }

    const activity = await this.storage.getTodayOrCreate();
    const repoName = this.getRepoName(event.document.uri);
    this.lastInteractionTime = Date.now();

    // Count line changes
    let linesChanged = 0;
    event.contentChanges.forEach((change) => {
      const text = change.text;
      const lines = text.split("\n").length - 1;
      const deletedLines = change.range.end.line - change.range.start.line;
      linesChanged += Math.max(lines, deletedLines);
    });

    activity.activity.linesChanged += linesChanged;
    this.updateRepoStats(activity, repoName, { linesChanged });

    activity.score = this.calculateScore(activity.activity);

    await this.storage.save(activity);
  }

  async recordActiveTime(): Promise<void> {
    if (!vscode.window.activeTextEditor) {
      return;
    }

    const now = Date.now();
    const elapsed = (now - this.activeEditorStartTime) / 1000 / 60; // in minutes
    const isIdle = now - this.lastInteractionTime > this.IDLE_THRESHOLD;

    if (elapsed >= 0.5 && !isIdle) {
      const activity = await this.storage.getTodayOrCreate();
      const minutesToAdd = Math.floor(elapsed);

      if (minutesToAdd > 0) {
        const repoName = this.getRepoName(
          vscode.window.activeTextEditor.document.uri,
        );
        activity.activity.timeSpent += minutesToAdd;
        this.updateRepoStats(activity, repoName, { timeSpent: minutesToAdd });

        activity.score = this.calculateScore(activity.activity);
        await this.storage.save(activity);

        // Reset start time to "now" AFTER recording to avoid double-counting or loss
        this.activeEditorStartTime = now;
      }
    } else if (isIdle) {
      // If idle, reset start time to "now" so we don't count the idle period when they return
      this.activeEditorStartTime = now;
    }
  }

  private getRepoName(uri: vscode.Uri): string {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    return workspaceFolder ? workspaceFolder.name : "Unknown";
  }

  private updateRepoStats(
    activity: DailyActivity,
    repoName: string,
    updates: {
      filesEdited?: number;
      linesChanged?: number;
      timeSpent?: number;
    },
  ) {
    if (!activity.activity.repos) {
      activity.activity.repos = {};
    }

    if (!activity.activity.repos[repoName]) {
      activity.activity.repos[repoName] = {
        filesEdited: 0,
        linesChanged: 0,
        timeSpent: 0,
        lastActive: new Date().toISOString(),
      };
    }

    const repo = activity.activity.repos[repoName];
    if (updates.filesEdited) repo.filesEdited += updates.filesEdited;
    if (updates.linesChanged) repo.linesChanged += updates.linesChanged;
    if (updates.timeSpent) repo.timeSpent += updates.timeSpent;
    repo.lastActive = new Date().toISOString();
  }

  private calculateScore(activity: any): number {
    // Scoring algorithm:
    // - 0-20 points: files edited (max 20)
    // - 0-30 points: lines changed (max 30)
    // - 0-50 points: time spent (max 50)

    let score = 0;

    // Files edited: 1 point per file, max 20
    score += Math.min(activity.filesEdited, 20);

    // Lines changed: 1 point per 10 lines, max 30
    score += Math.min(Math.floor(activity.linesChanged / 10), 30);

    // Time spent: 1 point per 2 minutes, max 50
    score += Math.min(Math.floor(activity.timeSpent / 2), 50);

    return Math.min(score, 100); // Cap at 100
  }

  isCurrentlyIdle(): boolean {
    return Date.now() - this.lastInteractionTime > this.IDLE_THRESHOLD;
  }

  private isExcludedFile(filePath: string): boolean {
    const excluded = [
      "node_modules",
      ".git",
      "dist",
      "build",
      ".DS_Store",
      ".vscode",
    ];

    for (const pattern of excluded) {
      if (filePath.includes(pattern)) {
        return true;
      }
    }

    return false;
  }
}
