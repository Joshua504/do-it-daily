---
description: How to package and run the extension on another machine
---

To run this VS Code extension on another machine (without using a development environment), you need to package it into a `.vsix` file and then install that file.

### 1. Package the Extension (on your current machine)

1. Open a terminal in the `vscode-extension` directory.
2. If you haven't already, install the dependencies:
   ```bash
   npm install
   ```
3. Run the package command:
   ```bash
   npm run package
   ```
   _Note: This will generate a file named `productivity-tracker-0.0.1.vsix` in the same directory._

### 2. Install on the Other Machine

1. Copy the `.vsix` file to the target machine (via USB, cloud, Slack, etc.).
2. Open **VS Code** on that machine.
3. Go to the **Extensions** view (Ctrl+Shift+X).
4. Click on the **"..."** (Views and More Actions) in the top-right corner of the Extensions sidebar.
5. Select **"Install from VSIX..."**.
6. Select the `productivity-tracker-0.0.1.vsix` file.

### 3. Configure the Extension

Once installed, you'll need to link it to your account using your API key:

1. Go to your **Do It Daily Dashboard**.
2. Navigate to **Settings**.
3. Generate a new **VS Code Access Token**.
4. In VS Code on the new machine, open **Settings** (Ctrl+,).
5. Search for `Productivity Tracker API Key`.
6. Paste your generated token into the field.
7. (Optional) Update the `Backend Url` setting if your backend is hosted at a specific IP or domain.

Your extension will now start tracking and syncing activity to your dashboard from the new machine!
