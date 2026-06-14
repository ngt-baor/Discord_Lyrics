import { LyricsFetcher } from "./LyricsFetcher"
import { SpotifySource} from "./Sources/SpotifySource"
import { NetEaseMusicSource } from "./Sources/NetEaseMusicSource"
import { LrcLibSource } from "./Sources/LrcLibSource"
import { QQMusicSource } from "./Sources/QQMusicSource"
import { PlaybackStateUpdater } from "./PlaybackStateUpdater"
import { PlaybackState } from "./PlaybackState"
import { StatusChanger } from "./StatusChanger"
import { Debug } from "./Debug"
import { broadcastPanelMessage, startServer } from "./Panel/Server"
import { Settings } from "./Settings"
import { Updater } from "./Updater"
import { SpotifyService } from "./SpotifyService"
import { v4 as uuidv4 } from "uuid"
import { ExternalAuthServerAPI } from "./ExternalAuthServerAPI"

let globalStatusChanger: StatusChanger | null = null

Settings.load()

if (Settings.update.enableAutoupdate) {
    Updater.tryUpdate()
        .then(() => {
            init()
        })
        .catch((e) => {
            Debug.write("DiscordLyrics failed to update. Error: " + e.stack)

            init()
        })
} else {
    init()
}

function translateRuntimeMessage(message: string): string {
    if (!message) return "Không có lỗi"

    return message
        .replace("Using Windows media fallback", "Đang đọc nhạc từ Windows")
        .replace("Reason:", "Lý do:")
        .replace("Spotify API is not configured", "không cấu hình Spotify API")
        .replace("Spotify API has no active playback", "Spotify API không thấy thiết bị đang phát")
        .replace("Spotify is not playing on an active device", "Spotify chưa phát nhạc trên thiết bị đang hoạt động")
        .replace("Windows media fallback found no Spotify/SpotX session", "Windows không tìm thấy phiên Spotify/SpotX")
        .replace("Windows media fallback found no YouTube Music session", "Windows không tìm thấy phiên YouTube Music")
        .replace("Windows media fallback failed", "đọc nhạc từ Windows thất bại")
        .replace("Paused", "Đang tạm dừng")
        .replace("Playing", "Đang phát")
        .replace("None", "Không có lỗi")
}

function getDisplayLyrics(playbackState: PlaybackState): string {
    const currentLineText = playbackState.currentLine && playbackState.currentLine.text.trim()

    if (currentLineText) return playbackState.currentLine!.text
    if (playbackState.songName && playbackState.lyricsLoading) return "Đang kiểm tra lyric..."
    if (playbackState.songName && !playbackState.hasLyrics) return `\uD83C\uDFB6 ${playbackState.songName}`
    if (playbackState.songName && playbackState.hasLyrics) return "\uD83C\uDFB6"

    return "ChÆ°a cÃ³"
}


export async function shutdown(): Promise<void> {
    if (globalStatusChanger && Settings.credentials.token) {
        Debug.write("Clearing Discord status before quit...")
        try {
            await Promise.race([
                globalStatusChanger.clearStatusRequest(Settings.credentials.token),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
            ])
            Debug.write("Discord status cleared successfully.")
        } catch (e) {
            Debug.write("Failed to clear Discord status on shutdown: " + (e as Error).stack)
        }
    }
}

async function init(): Promise<void> {
    if (!Settings.credentials.uuid) {
        Settings.credentials.uuid = uuidv4()

        Settings.save()
    }
    if (Settings.credentials.useExternalAuthServer) {
        ExternalAuthServerAPI.register().catch((e) => Debug.write("External auth register failed: " + e.stack))
    } else {
        SpotifyService.refresh()
            .then(() => Settings.save())
            .catch((e) => Debug.write("Spotify refresh failed: " + e.stack))
    }

    const lyricsFetcher = new LyricsFetcher()
    lyricsFetcher.addSource(new SpotifySource())
    lyricsFetcher.addSource(new LrcLibSource())
    lyricsFetcher.addSource(new NetEaseMusicSource())
    lyricsFetcher.addSource(new QQMusicSource())

    const playbackState = new PlaybackState()
    const playbackStateUpdater = new PlaybackStateUpdater(playbackState, lyricsFetcher)

    playbackStateUpdater.update()
        .catch((e) => Debug.write("Initial playback update failed: " + e.stack))

    const statusChanger = new StatusChanger(playbackState)
    globalStatusChanger = statusChanger

    setInterval(() => {
        playbackStateUpdater.update()
            .catch((e) => Debug.write("Playback update failed: " + e.stack))

        //console.log(playbackState)
        //console.log(statusChanger, playbackStateUpdater, SpotifyAccessToken)
    }, 500)

    let now = Date.now()
    setInterval(() => {
        statusChanger.changeStatus()

        if (playbackState.isPlaying) playbackState.songProgress += Date.now() - now

        if (playbackState.ended) statusChanger.songChanged()

        const runtimeStatus = translateRuntimeMessage(playbackState.errorMessage)
        const displayLyrics = getDisplayLyrics(playbackState)
        const fetchedFrom = lyricsFetcher.lastFetchedFrom === "Not fetched" ? "Chưa lấy" : lyricsFetcher.lastFetchedFrom
        const terminalText = `
    Bài hát: ${playbackState.songName || "Chưa phát nhạc"}
    Nghệ sĩ: ${playbackState.songAuthor || "Chưa phát nhạc"}
    Thời gian: ${statusChanger.formatSeconds(+(playbackState.songProgress / 1000).toFixed(0))}
    Lyric hiện tại: ${(playbackState.currentLine && playbackState.currentLine.text) || "Chưa có"}
    Nguồn lyric: ${fetchedFrom}
    Trạng thái: ${runtimeStatus}
    `

        broadcastPanelMessage("playback", {
            source: (Settings.view as any).activeSource || "spotify",
            song: playbackState.songName || "Chưa phát nhạc",
            author: playbackState.songAuthor || "Chưa phát nhạc",
            progress: statusChanger.formatSeconds(+(playbackState.songProgress / 1000).toFixed(0)),
            progressMs: playbackState.songProgress,
            lyricsLines: playbackState.lyrics ? playbackState.lyrics.lines : [],
            currentLineTime: playbackState.currentLine ? playbackState.currentLine.time : -1,
            lyricsDisplayBase: displayLyrics,
            currentLyrics: (playbackState.currentLine && playbackState.currentLine.text) || "Chưa có",
            lyricsDisplay: displayLyrics,
            fetchedFrom,
            error: runtimeStatus,
            isPlaying: playbackState.isPlaying,
            terminalText,
            rateLimitResetTime: playbackState.rateLimitResetTime,
            rateLimitDuration: playbackState.rateLimitDuration
        })

        console.clear()
        console.log(terminalText)

        now = Date.now()
    }, 1000 / 60)

    startServer()
}

process.on("uncaughtException", (e) => {
    Debug.write(e.stack + "\n" + e.cause)

    if (!e.message.includes("fetch failed")) {
        process.exit(1)
    }
})
