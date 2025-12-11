# License Verification Server

This is a simple Node.js license verification server designed to run on [Render.com](https://render.com).

Because Render has an ephemeral filesystem (files are deleted when the server restarts), this server uses **GitHub as a database**. It reads and writes valid licenses to a `licenses.json` file hosted in your private or public GitHub repository.

## Files

- `server.js`: The main Express server that handles verification requests.
- `generate-license.js`: A helper script to generate new license keys locally.
- `licenses.json`: The database file storing all licenses.

## Setup & Deployment Guide

### 1. Prepare GitHub Repository
1.  Ensure this `license` folder is part of a GitHub repository.
2.  Make sure `licenses.json` exists in the repository. If you are starting fresh, it can contain an empty array `[]`.

### 2. Create a GitHub Personal Access Token (PAT)
The server needs permission to read and write to your repository.
1.  Go to **GitHub Settings** -> **Developer settings** -> **Personal access tokens** -> **Tokens (classic)**.
2.  Click **Generate new token (classic)**.
3.  Name it "License Server".
4.  **Scopes**: Check `repo` (Full control of private repositories).
5.  Generate and **copy** the token. You will need it for Render.

### 3. Deploy to Render.com
1.  Log in to [Render dashboard](https://dashboard.render.com).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  **Settings**:
    -   **Runtime**: Node
    -   **Build Command**: `npm install`
    -   **Start Command**: `node server.js`
    -   **Root Directory**: `license` (since your server is in this subfolder).
5.  **Environment Variables** (Click "Advanced" or "Environment"):
    Add the following variables:
    
    | Key | Value |
    | --- | --- |
    | `GITHUB_TOKEN` | The token you copied from GitHub (starts with `ghp_...`). |
    | `GITHUB_OWNER` | Your GitHub username (or organization name). |
    | `GITHUB_REPO` | The name of your repository. |
    | `GITHUB_PATH` | Path to the json file, e.g., `license/licenses.json` (if inside license folder) or just `licenses.json` depending on repo structure. |
    | `NODE_VERSION` | `18` (or higher) |

6.  Click **Create Web Service**.

### 4. How to Generate a License
1.  Run the generator script locally on your computer:
    ```bash
    node generate-license.js "Client Name" 365 3
    # Usage: node generate-license.js "Test User" 365 3
    ```
    This will append a new license to your local `licenses.json` file.

2.  **Commit and Push** the change to GitHub:
    ```bash
    git add licenses.json
    git commit -m "Add license for Client Name"
    git push origin main
    ```
    *Note: The server reads from GitHub, so it will see the new license immediately after you push.*

### 5. API Usage
**Endpoint**: `POST /api/verify-license`

**Body**:
```json
{
  "key": "ABCD-1234-EFGH-5678",
  "deviceId": "Customer-PC-Hostname"
}
```

**Response**:
```json
{
  "valid": true,
  "customerName": "Client Name",
  "expiresAt": "2025-01-01T00:00:00.000Z",
  "maxDevices": 3,
  "usedDevices": 1
}
```
