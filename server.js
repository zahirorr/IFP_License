import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Load environment variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER; // e.g., "username"
const GITHUB_REPO = process.env.GITHUB_REPO;   // e.g., "my-repo"
const GITHUB_PATH = process.env.GITHUB_PATH || "licenses.json"; // Path in the repo

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.warn("⚠️ GitHub environment variables are missing! Persistence will not work.");
}

/**
 * Fetch licenses.json from GitHub
 * Returns { data: [], sha: string }
 */
async function loadLicensesFromGitHub() {
  if (!GITHUB_TOKEN) return { data: [], sha: null };

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const fileContent = Buffer.from(response.data.content, "base64").toString("utf-8");
    const json = JSON.parse(fileContent);
    return { data: Array.isArray(json) ? json : [], sha: response.data.sha };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log("ℹ️ licenses.json not found on GitHub. Starting with empty list.");
      return { data: [], sha: null }; // File doesn't exist yet
    }
    console.error("Error loading from GitHub:", error.message);
    throw error;
  }
}

/**
 * Update licenses.json on GitHub
 * Requires the SHA of the file we are updating (optimistic locking)
 */
async function saveLicensesToGitHub(licenses, sha) {
  if (!GITHUB_TOKEN) return;

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
  const contentBase64 = Buffer.from(JSON.stringify(licenses, null, 2)).toString("base64");

  try {
    await axios.put(
      url,
      {
        message: "Update license device registration [bot]",
        content: contentBase64,
        sha: sha, // required if file exists
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    console.log("✅ GitHub updated successfully.");
  } catch (error) {
    console.error("Error saving to GitHub:", error.response?.data || error.message);
    throw new Error("Failed to save license data.");
  }
}

// 🔹 Health-Check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/verify-license", async (req, res) => {
  const { key, deviceId } = req.body || {};

  if (!key) {
    return res.status(400).json({ valid: false, reason: "NO_KEY" });
  }
  if (!deviceId) {
    return res.status(400).json({ valid: false, reason: "NO_DEVICE_ID" });
  }

  try {
    // 1. Fetch latest data
    const { data: licenses, sha } = await loadLicensesFromGitHub();
    const now = new Date();
    const lic = licenses.find((l) => l.key === key.trim());

    if (!lic) {
      return res.json({ valid: false, reason: "NOT_FOUND" });
    }

    // 2. Check expiration
    if (lic.expiresAt) {
      const exp = new Date(lic.expiresAt);
      if (isNaN(exp.getTime()) || exp < now) {
        return res.json({ valid: false, reason: "EXPIRED" });
      }
    }

    // 3. Check devices
    const maxDevices = typeof lic.maxDevices === "number" && lic.maxDevices > 0
      ? lic.maxDevices
      : 1;

    if (!Array.isArray(lic.devices)) {
      lic.devices = [];
    }
    lic.devices = lic.devices.filter((d) => typeof d === "string" && d.trim().length > 0);

    const alreadyRegistered = lic.devices.includes(deviceId);

    if (!alreadyRegistered) {
      if (lic.devices.length >= maxDevices) {
        return res.json({
          valid: false,
          reason: "MAX_DEVICES_REACHED",
          maxDevices,
          usedDevices: lic.devices.length,
        });
      }

      // Register new device
      lic.devices.push(deviceId);

      // 4. Save back to GitHub
      await saveLicensesToGitHub(licenses, sha);

      console.log(`📌 License ${lic.key}: new device registered (${deviceId}).`);
    }

    // Success
    return res.json({
      valid: true,
      reason: null,
      customerName: lic.customerName,
      expiresAt: lic.expiresAt || null,
      maxDevices,
      usedDevices: lic.devices.length,
    });

  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ valid: false, reason: "SERVER_ERROR" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("License server running on port", PORT);
});
