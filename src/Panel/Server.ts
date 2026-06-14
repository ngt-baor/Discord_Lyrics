import express from "express"
import { createServer } from "node:http"
import { WebSocketServer } from "ws"
import { join } from "node:path"
import { Settings } from "../Settings"
import { SpotifyService } from "../SpotifyService"
import { Debug } from "../Debug"
import { WindowsMediaService } from "../WindowsMediaService"

const clients: Set<import("ws").WebSocket> = new Set()

function getSettingsPayload(): object {
    return {
        credentials: Settings.credentials,
        view: Settings.view,
        timings: Settings.timings,
        update: Settings.update
    }
}

export function broadcastPanelMessage(type: string, payload: object): void {
    const message = JSON.stringify({ type, payload })

    for (const client of clients) {
        if (client.readyState === client.OPEN) {
            client.send(message)
        }
    }
}

export function broadcastSettings(): void {
    broadcastPanelMessage("settings", getSettingsPayload())
}

export function startServer(): void {
    const app = express()
    const httpServer = createServer(app)
    const wss = new WebSocketServer({
        server: httpServer,
        path: "/ws"
    })

    app.use("/", express.static(join(__dirname, "../../static")))

    app.get("/", (req, res) => {
        res.sendFile(join(__dirname, "../../static/index.html"))
    })

    app.get("/callback", async (req, res) => {
        if (Settings.credentials.useExternalAuthServer) {
            if (!req.query.refresh_token) return res.sendStatus(401)

            const refreshToken = req.query.refresh_token
            Settings.credentials.refreshToken = refreshToken as string
            Settings.save()
        } else {
            if (!req.query.code) return res.sendStatus(401)

            const code = req.query.code
            Settings.credentials.code = code as string

            try {
                await SpotifyService.exchange()
                Settings.save()
            } catch(e) {
                Debug.write("Spotify authorization callback failed: " + (e as Error).stack)
                return res.status(500).send("Spotify authorization failed. Check Client ID, Client Secret, Redirect URI, then try Authorize Spotify again.")
            }
        }

        res.send("OK. You can close this page now.")
    })

    wss.on("connection", (ws) => {
        clients.add(ws)

        ws.on("message", (data) => {
            const message = JSON.parse(data.toString())
            const settings = message.type === "settings" ? message.payload : message
            // Not typed but it's necessary

            const oldActiveSource = (Settings.view as any).activeSource || "spotify"
            const newActiveSource = settings.view.activeSource || "spotify"

            const oldMiniMode = (Settings.view as any).miniMode || false
            const newMiniMode = settings.view.miniMode || false

            Settings.credentials = settings.credentials
            Settings.view = settings.view
            Settings.timings = settings.timings
            Settings.update = settings.update

            Settings.save()

            if (oldMiniMode !== newMiniMode) {
                if (typeof (global as any).toggleMiniMode === "function") {
                    (global as any).toggleMiniMode(newMiniMode)
                }
            }

            if (oldActiveSource !== newActiveSource) {
                // Switch media playback!
                if (newActiveSource === "spotify") {
                    // Pause YouTube Music, Play Spotify
                    WindowsMediaService.controlSession("ytmusic", "pause")
                        .then(() => {
                            setTimeout(() => {
                                WindowsMediaService.controlSession("spotify", "play")
                            }, 500) // 500ms delay to make it smooth
                        })
                } else if (newActiveSource === "ytmusic") {
                    // Pause Spotify, Play YouTube Music
                    WindowsMediaService.controlSession("spotify", "pause")
                        .then(() => {
                            setTimeout(() => {
                                WindowsMediaService.controlSession("ytmusic", "play")
                            }, 500)
                        })
                }
            }
        })

        ws.on("close", () => clients.delete(ws))

        ws.send(JSON.stringify({
            type: "settings",
            payload: getSettingsPayload()
        }))
    })

    httpServer.listen(8999)
}
