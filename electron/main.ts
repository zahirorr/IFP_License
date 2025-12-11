import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let win: BrowserWindow | null = null

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simple migration, though true is safer
        },
    })

    // Development
    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL)
    } else {
        // Production
        win.loadFile(join(__dirname, '../dist/index.html'))
    }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})
