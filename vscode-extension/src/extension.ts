import * as vscode from "vscode";
import { Storage } from "./storage";
import { ActivityTracker } from "./tracker";
import { Syncer } from "./sync";
import { StatusBarManager } from "./statusbar";

let storage: Storage;
let tracker: ActivityTracker;
let syncer: Syncer;
let statusBar: StatusBarManager;
let timeCheckInterval: any = null;

export function activate(context: vscode.ExtensionContext) {
  console.log("Productivity Tracker: Activating...");

  // Initialize storage
  storage = new Storage(context.globalStoragePath);
  storage.initialize().then(() => {
    console.log("Storage initialized");
    checkOnboarding();
  });

  function checkOnboarding() {
    const config = vscode.workspace.getConfiguration("productivityTracker");
    const apiKey = config.get<string>("apiKey");

    if (!apiKey) {
      vscode.window
        .showInformationMessage(
          "🚀 Productivity Tracker is installed! Sign up to see your coding stats on the dashboard.",
          "Sign Up / Get Token",
        )
        .then((selection) => {
          if (selection === "Sign Up / Get Token") {
            vscode.env.openExternal(
              vscode.Uri.parse("http://localhost:5173/settings"),
            );
            promptForDailyGoal();
          }
        });
    }
  }

  async function promptForDailyGoal() {
    const goal = await vscode.window.showInputBox({
      prompt: "How many hours do you want to work daily?",
      placeHolder: "e.g. 3",
      validateInput: (text) => {
        const num = parseInt(text);
        return isNaN(num) || num < 1 || num > 24
          ? "Please enter a number between 1 and 24"
          : null;
      },
    });

    if (goal) {
      vscode.window.showInformationMessage(
        `Daily goal set to ${goal} hours! Make sure to add your API key in settings.`,
      );
    }
  }

  // Initialize tracker, syncer, and status bar
  tracker = new ActivityTracker(storage);
  syncer = new Syncer(storage, tracker);
  statusBar = new StatusBarManager(storage);

  // Start tracking
  tracker.start();
  syncer.start();
  statusBar.show();

  // Record active editor time every 1 minute
  timeCheckInterval = setInterval(
    () => {
      tracker.recordActiveTime();
    },
    1 * 60 * 1000,
  );

  // Register commands
  const syncCommand = vscode.commands.registerCommand(
    "productivity.syncNow",
    async () => {
      vscode.window.showInformationMessage("Syncing productivity data...");
      const success = await syncer.syncNow();
      if (success) {
        vscode.window.showInformationMessage("✓ Sync successful");
      } else {
        vscode.window.showErrorMessage(
          "✗ Sync failed. Check backend connection.",
        );
      }
    },
  );

  const statsCommand = vscode.commands.registerCommand(
    "productivity.showStats",
    async () => {
      await syncer.showStats();
    },
  );

  const resetCommand = vscode.commands.registerCommand(
    "productivity.resetData",
    async () => {
      const confirm = await vscode.window.showWarningMessage(
        "Are you sure you want to reset all productivity data?",
        "Yes",
        "No",
      );

      if (confirm === "Yes") {
        await storage.clear();
        vscode.window.showInformationMessage("Data cleared");
      }
    },
  );

  context.subscriptions.push(syncCommand, statsCommand, resetCommand);

  console.log("Productivity Tracker: Activated successfully");
}

export function deactivate() {
  console.log("Productivity Tracker: Deactivating...");

  if (timeCheckInterval) {
    clearInterval(timeCheckInterval);
  }

  tracker.stop();
  syncer.stop();
  statusBar.dispose();

  console.log("Productivity Tracker: Deactivated");
}
