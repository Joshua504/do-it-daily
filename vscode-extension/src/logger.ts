import * as vscode from "vscode";

export class Logger {
  private static channel: vscode.OutputChannel;

  static initialize() {
    this.channel = vscode.window.createOutputChannel("Productivity Tracker");
    this.log("Logger initialized");
  }

  static log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.channel.appendLine(`[${timestamp}] ${message}`);
  }

  static error(message: string, error?: any) {
    const timestamp = new Date().toLocaleTimeString();
    this.channel.appendLine(`[${timestamp}] ERROR: ${message}`);
    if (error) {
      this.channel.appendLine(JSON.stringify(error, null, 2));
    }
    this.channel.show();
  }

  static show() {
    this.channel.show();
  }
}
