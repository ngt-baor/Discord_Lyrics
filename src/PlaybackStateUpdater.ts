import { PlaybackState } from "./PlaybackState"
import { LyricsFetcher } from "./LyricsFetcher"
import { SpotifyService } from "./SpotifyService"
import { Settings } from "./Settings"
import { ExternalAuthServerAPI } from "./ExternalAuthServerAPI"
import { WindowsMediaPlayback, WindowsMediaService } from "./WindowsMediaService"

function cleanTitle(title: string): string {
    if (!title) return ""
    return title
        .replace(/ ?\[(Official|MV|Music Video|Lyrics|HD|4K|Audio).*?\]/gi, "")
        .replace(/ ?\((Official|MV|Music Video|Lyrics|HD|4K|Audio).*?\)/gi, "")
        .replace(/ ?-( ?Official| ?MV| ?Music Video| ?Lyrics| ?Audio).*$/gi, "")
        .replace(/ ?\|.*$/gi, "")
        .normalize("NFC")
        .trim()
}

interface PlaybackResponse {
    item: {
        name: string
        id: string

        artists: {
            name: string
        }[]

        duration_ms: number
    }

    progress_ms: number

    is_playing: boolean
}

export class PlaybackStateUpdater {
    public playbackState: PlaybackState

    public lyricsFetcher: LyricsFetcher
    private useWindowsMediaOnly: boolean
    private lastApiProgress: number
    private lastApiUpdateTime: number

    constructor(playbackState: PlaybackState, lyricsFetcher: LyricsFetcher) {
        this.playbackState = playbackState

        this.lyricsFetcher = lyricsFetcher
        this.useWindowsMediaOnly = false
        this.lastApiProgress = 0
        this.lastApiUpdateTime = 0
    }

    public async update(): Promise<void> {
        const roundTripTimeStart = Date.now()
        const activeSource = (Settings.view as any).activeSource || "spotify"
        if (activeSource === "ytmusic") {
            await this.updateFromWindowsMedia("YouTube Music selected", "ytmusic")
            return
        }

        if (this.useWindowsMediaOnly || (!Settings.credentials.refreshToken && !Settings.credentials.useExternalAuthServer)) {
            await this.updateFromWindowsMedia("Spotify API is not configured", "spotify")
            return
        }

        let request = await this.requestPlayback()

        if (request.status === 401 || request.status === 400) {
            if (Settings.credentials.useExternalAuthServer) {
                SpotifyService.token = await ExternalAuthServerAPI.getToken() || ""
            } else {
                await SpotifyService.refresh()
            }

            request = await this.requestPlayback()
        }

        if (request.status === 204) {
            await this.updateFromWindowsMedia("Spotify API has no active playback", "spotify")
            return
        }

        if (request.status === 200) {
            this.playbackState.errorMessage = ""
            const json = await request.json() as PlaybackResponse
            if (!json.item) {
                this.clearPlayback()
                return
            }

            const playbackState = this.playbackState
            const newProgress = json.progress_ms + (Date.now() - roundTripTimeStart)
            const isPlayingChanged = playbackState.isPlaying !== json.is_playing
            const songIdChanged = playbackState.songId !== json.item.id

            playbackState.isPlaying = json.is_playing

            if (songIdChanged) {
                playbackState.songName = json.item.name.replace(/ \(.+\)/, "").normalize("NFC").trim()
                playbackState.songAuthor = (json.item.artists[0]?.name || "").normalize("NFC").trim()

                playbackState.oldSongId = playbackState.songId
                playbackState.songId = json.item.id

                playbackState.songDuration = json.item.duration_ms
                playbackState.songProgress = newProgress
                
                this.lastApiProgress = json.progress_ms
                this.lastApiUpdateTime = Date.now()

                await this.loadLyricsForCurrentSong()
            } else {
                if (isPlayingChanged || !json.is_playing) {
                    playbackState.songProgress = newProgress
                    this.lastApiProgress = json.progress_ms
                    this.lastApiUpdateTime = Date.now()
                } else {
                    const timeElapsed = Date.now() - this.lastApiUpdateTime
                    const isSeekBackward = json.progress_ms < this.lastApiProgress - 1500
                    const isSeekForward = json.progress_ms > this.lastApiProgress + timeElapsed + 2000

                    if (isSeekBackward || isSeekForward) {
                        playbackState.songProgress = newProgress
                        this.lastApiProgress = json.progress_ms
                        this.lastApiUpdateTime = Date.now()
                    }
                }
            }
            if (this.lyricsFetcher.lastFetchedFor !== (playbackState.songName + playbackState.songAuthor)) {
                // If song switches, and we didn't get lyrics of previous song yet, wrong lyrics may set. Check for wrong lyrics and set correct lyrics
                await this.loadLyricsForCurrentSong()
            }
        } else {
            const errorText = await request.text().catch(() => "")
            this.playbackState.errorMessage = `Spotify API HTTP ${request.status}${errorText ? ": " + errorText : ""}`

            if (request.status === 401 || request.status === 403) {
                if (errorText.includes("Active premium subscription required")) {
                    this.useWindowsMediaOnly = true
                }

                await this.updateFromWindowsMedia(this.playbackState.errorMessage, "spotify")
            }
        }
    }

    private async requestPlayback(): Promise<Response> {
        const token = Settings.credentials.useExternalAuthServer
            ? SpotifyService.token
            : await SpotifyService.ensureToken()

        return fetch("https://api.spotify.com/v1/me/player?additional_types=track", {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        })
    }

    private clearPlayback(): void {
        this.playbackState.isPlaying = false
        this.playbackState.songProgress = 0
        this.playbackState.songDuration = 0
        this.playbackState.lyricsLoading = false
        this.playbackState.errorMessage = "Spotify is not playing on an active device"
    }

    private async loadLyricsForCurrentSong(): Promise<void> {
        const playbackState = this.playbackState
        const songId = playbackState.songId
        const songName = playbackState.songName
        const songAuthor = playbackState.songAuthor

        playbackState.lyricsLoading = true
        playbackState.lyrics = null
        playbackState.currentLine = null
        playbackState.hasLyrics = false

        const activeSource = (Settings.view as any).activeSource || "spotify"
        const isFallback = songId.includes(":")
        const lyrics = await this.lyricsFetcher.fetchLyrics(songName, songAuthor, activeSource, isFallback)

        if (playbackState.songId !== songId) return

        playbackState.lyrics = lyrics
        playbackState.hasLyrics = !!lyrics && !!lyrics.lines.length && lyrics.lines.some((line) => !!line.text.trim())
        playbackState.lyricsLoading = false
    }

    private async updateFromWindowsMedia(reason: string, targetSource: string = "spotify"): Promise<void> {
        let media: WindowsMediaPlayback

        try {
            media = await WindowsMediaService.readPlayback(targetSource)
        } catch(e) {
            this.clearPlayback()
            this.playbackState.errorMessage = `${reason}; Windows media fallback failed: ${(e as Error).message}`
            return
        }

        if (!media.hasSession || !media.title) {
            this.clearPlayback()
            const sourceName = targetSource === "ytmusic" ? "YouTube Music" : "Spotify/SpotX"
            this.playbackState.errorMessage = `${reason}; Windows media fallback found no ${sourceName} session`
            return
        }

        const playbackState = this.playbackState
        const songId = `${media.sourceAppUserModelId || "windows"}:${media.title}:${media.artist || ""}`
        const newProgress = media.positionMs || 0
        const isPlaying = media.playbackStatus === "Playing"
        const isPlayingChanged = playbackState.isPlaying !== isPlaying
        const songIdChanged = playbackState.songId !== songId

        playbackState.isPlaying = isPlaying
        playbackState.errorMessage = `Using Windows media fallback (${media.playbackStatus || "Unknown"}). Reason: ${reason}`

        if (songIdChanged) {
            playbackState.songName = cleanTitle(media.title)
            playbackState.songAuthor = (media.artist || "").normalize("NFC").trim()

            playbackState.oldSongId = playbackState.songId
            playbackState.songId = songId
            playbackState.songDuration = media.endTimeMs || 0
            playbackState.songProgress = newProgress
            
            this.lastApiProgress = newProgress
            this.lastApiUpdateTime = Date.now()

            await this.loadLyricsForCurrentSong()
        } else {
            if (isPlayingChanged || !isPlaying) {
                playbackState.songDuration = media.endTimeMs || 0
                playbackState.songProgress = newProgress
                this.lastApiProgress = newProgress
                this.lastApiUpdateTime = Date.now()
            } else {
                const timeElapsed = Date.now() - this.lastApiUpdateTime
                const isSeekBackward = newProgress < this.lastApiProgress - 1500
                const isSeekForward = newProgress > this.lastApiProgress + timeElapsed + 2000

                if (isSeekBackward || isSeekForward) {
                    playbackState.songDuration = media.endTimeMs || 0
                    playbackState.songProgress = newProgress
                    this.lastApiProgress = newProgress
                    this.lastApiUpdateTime = Date.now()
                }
            }
        }
    }
}
