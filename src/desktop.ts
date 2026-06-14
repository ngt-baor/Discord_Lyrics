import { app, BrowserWindow, Menu, shell, Tray } from "electron"
import { join } from "node:path"
import { Settings } from "./Settings"
import { shutdown } from "./index"

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let normalBounds: any = null
const appUserModelId = "local.discordlyrics.desktop"

;(global as any).toggleMiniMode = (enabled: boolean) => {
    if (mainWindow) {
        const isCurrentlyMini = mainWindow.isAlwaysOnTop()
        if (!isCurrentlyMini && enabled) {
            normalBounds = mainWindow.getBounds()
        }
        mainWindow.destroy()
        mainWindow = null
    }
    createWindow()
}

function getIconPath(): string {
    if (app.isPackaged) {
        return join(process.resourcesPath, "assets", "icon.ico")
    }

    return join(__dirname, "../assets/icon.ico")
}

function createWindow(): void {
    const isMini = (Settings.view as any).miniMode || false
    mainWindow = new BrowserWindow({
        width: isMini ? 380 : (normalBounds?.width || 1120),
        height: isMini ? 360 : (normalBounds?.height || 680),
        x: isMini ? undefined : normalBounds?.x,
        y: isMini ? undefined : normalBounds?.y,
        minWidth: isMini ? 250 : 900,
        minHeight: isMini ? 50 : 560,
        alwaysOnTop: isMini,
        frame: !isMini,
        transparent: isMini,
        resizable: true,
        hasShadow: !isMini,
        title: "DiscordLyrics",
        icon: getIconPath(),
        backgroundColor: isMini ? "#00000000" : "#202124",
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url)
        return { action: "deny" }
    })

    mainWindow.on("close", (event) => {
        if (isQuitting) return

        event.preventDefault()
        mainWindow?.hide()
    })

    const delay = normalBounds ? 0 : 800
    setTimeout(() => {
        mainWindow?.loadURL("http://127.0.0.1:8999")
    }, delay)
}

function showMainWindow(): void {
    if (!mainWindow) createWindow()

    mainWindow?.show()
    mainWindow?.focus()
}

function createTray(): void {
    tray = new Tray(getIconPath())
    tray.setToolTip("DiscordLyrics")
    tray.setContextMenu(Menu.buildFromTemplate([
        {
            label: "Open DiscordLyrics",
            click: showMainWindow
        },
        {
            label: "Quit",
            click: async () => {
                isQuitting = true
                try {
                    await shutdown()
                } catch (e) {
                    // Ignore errors
                }
                app.quit()
            }
        }
    ]))
    tray.on("double-click", showMainWindow)
}

app.setAppUserModelId(appUserModelId)

app.whenReady().then(() => {
    createWindow()
    createTray()
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        // Keep running in the tray until the user chooses Quit.
    }
})
