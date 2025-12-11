# HOW TO ADD A NEW CUSTOMER LICENSE (Server-based)

This file explains exactly what you must do when you have a **new customer** and want to create and activate a **new license key** for your CamDesigner license server.

---

## 1. Go to the `license-server` folder

Open **Command Prompt** and go to the license server directory, for example:

```bat
cd C:\zaher\Work\CamDesigner mDesigner_online_server_license\license-server
```

(Adjust the path if your project is in a different location.)

---

## 2. (Optional) Pull latest changes from GitHub

If you work on multiple PCs or have changed something already on GitHub, run:

```bat
git pull
```

This makes sure your local `license-server` is up to date.

---

## 3. Generate a new license key

Use the `generate-license.js` script to create a new license for the customer.

Syntax:

```bat
node generate-license.js "CUSTOMER NAME" DAYS_VALID number_of_devidces
```

Examples:

```bat
node generate-license.js "Firma Müller GmbH" 365
node generate-license.js "Herr Meier" 30
node generate-license.js "Testkunde 123" 90
```

What this does:

- It reads `licenses.json`
- Adds a new entry for this customer
- Prints a new license key in the console, for example:

```text
Generated license key: ABCD-1234-XYZ
Saved to licenses.json
```

👉 **Important:** Copy this key and save it somewhere safe (e.g. Excel, Notion, customer list).

---

## 4. (Optional) Check `licenses.json`

You can quickly check if your new customer is inside `licenses.json`:

```bat
type licenses.json
```

Or open the file in VS Code / any editor and look for the new entry, for example:

```json
{
  "key": "ABCD-1234-XYZ",
  "customerName": "Firma Müller GmbH",
  "expiresAt": "2026-11-29T00:00:00.000Z"
}
```

---

## 5. Stage the changes with Git

See what changed:

```bat
git status
```

You should at least see `licenses.json` as "modified".  
Then add it to the next commit:

```bat
git add licenses.json
```

(If you also changed other server files like `server.js` or `generate-license.js`, add them too.)

---

## 6. Commit the new license

Create a Git commit with a clear message, for example:

```bat
git commit -m "Add license for Firma Müller GmbH (365 days)"
```

or

```bat
git commit -m "Add license for Herr Meier (30 days)"
```

---

## 7. Push to GitHub

Send your changes to GitHub:

```bat
git push
```

Now your updated `licenses.json` with the new license is in the GitHub repository.

Your deployment platform (e.g. Render) will detect the new commit automatically and start a new deploy of the license server.

---

## 8. Wait for the server to redeploy

On Render (or your hosting provider), wait until the new deployment finishes and the service is **Live/Healthy** again.

If you want to test the license manually, you can call the `/api/verify-license` endpoint.

Example using PowerShell + curl:

```powershell
curl -Method POST `
  -Uri "https://YOUR-RENDER-URL.onrender.com/api/verify-license" `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ "key": "ABCD-1234-XYZ", "deviceId": "test-device" }'
```

Expected response for a valid license:

```json
{
  "valid": true,
  "reason": null,
  "customerName": "Firma Müller GmbH",
  "expiresAt": "2026-11-29T00:00:00.000Z"
}
```

---

## 9. Send the license key to the customer

Now you can give the customer their license key, for example:

- License key: `ABCD-1234-XYZ`

You should also send a short instruction, e.g.:

> 1. Install and start CamDesigner.  
> 2. When the program asks for a license, enter: `ABCD-1234-XYZ`.  
> 3. The program verifies the key online.  
> 4. If the license is valid, the program is unlocked and ready to use.

---

## 10. Short checklist (summary)

For each **new customer**:

1. `cd ...\license-server`
2. `node generate-license.js "Customer Name" DAYS`
3. Copy the generated license key and save it.
4. `git add licenses.json`
5. `git commit -m "Add license for Customer Name (DAYS days)"`
6. `git push`
7. Wait until the license server is redeployed.
8. Send the license key to the customer.
9. Customer enters the key in the app → server verifies → program runs.

---

You can extend this file any time with your own notes (e.g. standard durations, pricing, customer list references, etc.).


some notes: 
render server adress: https://camdesigner-license-server.onrender.com
GitHub https://github.com/zahirorr/camdesigner-license-server


node generate-license.js "Kunde GmbH" 365 2
git add licenses.json
git commit -m "add 10 Test users for 15 days"
git push