// test-license.js – Version mit eingebautem fetch in Node 24

const LICENSE_URL =
  "https://camdesigner-license-server.onrender.com/api/verify-license"; // <-- deine Render-URL

// HIER deinen echten Lizenz-Key eintragen:
const TEST_KEY = "7D00-700E-3257-6C39"; // oder welcher Key gerade Probleme macht

// Und eine Device-ID, z.B. Name des PCs:
const DEVICE_ID = "TEST-PC-2";

async function run() {
  try {
    const res = await fetch(LICENSE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: TEST_KEY,
        deviceId: DEVICE_ID,
      }),
    });

    const data = await res.json();
    console.log("Antwort vom Lizenz-Server:");
    console.log(data);
  } catch (err) {
    console.error("Fehler beim Aufruf:", err);
  }
}

run();
