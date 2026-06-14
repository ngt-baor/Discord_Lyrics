import { PlaybackState } from "./PlaybackState"
import { Settings } from "./Settings"
import { LyricsLine } from "./Sources/BaseSource"
import { Autooffset } from "./Autooffset"
import { Debug } from "./Debug"
import { broadcastSettings } from "./Panel/Server"

export class StatusChanger {
    public playbackState: PlaybackState

    public sentLines: LyricsLine[]

    public autooffset: Autooffset

    private lastStatusKey: string
    private lastSongId: string
    private lastSavedAutoOffset: number
    private lastSentTime: number
    private rateLimitResetTime: number
    private isRequestPending: boolean
    private dynamicMinSendInterval: number
    private sentTimestamps: number[]

    constructor(playbackState: PlaybackState) {
        this.playbackState = playbackState

        this.sentLines = []

        this.autooffset = new Autooffset()

        this.lastStatusKey = ""
        this.lastSongId = ""
        this.lastSavedAutoOffset = Settings.timings.sendTimeOffset
        this.lastSentTime = 0
        this.rateLimitResetTime = 0
        this.isRequestPending = false
        this.dynamicMinSendInterval = Settings.timings.minSendInterval ?? 700
        this.sentTimestamps = []
    }

    public changeStatusRequest(text: string | null, token: string, emoji: string): Promise<Response> {
        this.lastSentTime = Date.now()
        this.isRequestPending = true
        const now = Date.now()

        const request = fetch("https://discord.com/api/v9/users/@me/settings", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify({
                custom_status: {
                    text,
                    emoji_id: null,
                    emoji_name: emoji,
                    expires_at: null
                }
            })
        })

        request.then((response) => {
            this.autooffset.addValue(Date.now() - now)

            if (!response.ok) {
                Debug.write(`Discord status update failed with HTTP ${response.status}`)
                this.lastStatusKey = ""
                this.isRequestPending = false
                if (response.status === 429) {
                    response.json().then((body: any) => {
                        const retryAfter = body?.retry_after ?? 5
                        const resetTime = Date.now() + Math.ceil(retryAfter * 1000)
                        this.rateLimitResetTime = resetTime
                        this.playbackState.rateLimitResetTime = resetTime
                        this.playbackState.rateLimitDuration = retryAfter
                        Debug.write(`Discord rate limited. Retrying after ${retryAfter} seconds.`)
                    }).catch(() => {
                        const retryHeader = response.headers.get("Retry-After")
                        const retryAfter = retryHeader ? parseFloat(retryHeader) : 5
                        const resetTime = Date.now() + Math.ceil(retryAfter * 1000)
                        this.rateLimitResetTime = resetTime
                        this.playbackState.rateLimitResetTime = resetTime
                        this.playbackState.rateLimitDuration = retryAfter
                        Debug.write(`Discord rate limited. Retrying after ${retryAfter} seconds (fallback).`)
                    })
                    // Set to high interval immediately on 429
                    this.dynamicMinSendInterval = 3000
                }
                return
            }

            // Slowly decay dynamicMinSendInterval on success
            const targetMinInterval = Settings.timings.minSendInterval ?? 700
            if (this.dynamicMinSendInterval > targetMinInterval) {
                this.dynamicMinSendInterval = Math.max(targetMinInterval, this.dynamicMinSendInterval - 100)
            }

            this.updateAutoOffsetSetting()
            this.isRequestPending = false
        }).catch(() => {
            this.isRequestPending = false
        })

        return request
    }

    public clearStatusRequest(token: string): Promise<Response> {
        this.lastSentTime = Date.now()
        this.isRequestPending = true
        const request = fetch("https://discord.com/api/v9/users/@me/settings", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify({
                custom_status: null
            })
        })

        request.then((response) => {
            if (!response.ok) {
                Debug.write(`Discord status clear failed with HTTP ${response.status}`)
                this.lastStatusKey = ""
                this.isRequestPending = false
                if (response.status === 429) {
                    response.json().then((body: any) => {
                        const retryAfter = body?.retry_after ?? 5
                        const resetTime = Date.now() + Math.ceil(retryAfter * 1000)
                        this.rateLimitResetTime = resetTime
                        this.playbackState.rateLimitResetTime = resetTime
                        this.playbackState.rateLimitDuration = retryAfter
                        Debug.write(`Discord rate limited. Retrying after ${retryAfter} seconds.`)
                    }).catch(() => {
                        const retryHeader = response.headers.get("Retry-After")
                        const retryAfter = retryHeader ? parseFloat(retryHeader) : 5
                        const resetTime = Date.now() + Math.ceil(retryAfter * 1000)
                        this.rateLimitResetTime = resetTime
                        this.playbackState.rateLimitResetTime = resetTime
                        this.playbackState.rateLimitDuration = retryAfter
                        Debug.write(`Discord rate limited. Retrying after ${retryAfter} seconds (fallback).`)
                    })
                }
            } else {
                this.isRequestPending = false
            }
        }).catch(() => {
            this.isRequestPending = false
        })

        return request
    }

    public changeStatus(): void {
        if (this.isRequestPending) return

        if (Date.now() >= this.rateLimitResetTime) {
            this.playbackState.rateLimitResetTime = 0
            this.playbackState.rateLimitDuration = 0
        }

        const playbackState = this.playbackState

        if (playbackState.songId !== this.lastSongId) {
            this.sentLines = []
            this.lastStatusKey = ""
            this.lastSongId = playbackState.songId
        }

        if (!Settings.credentials.token) return

        if (!Settings.view.discordEnabled) {
            this.clearStatusOnce()
            return
        }

        if (playbackState.ended || !playbackState.isPlaying) {
            this.clearStatusOnce()
            return
        }

        const lyrics = playbackState.lyrics

        if (playbackState.lyricsLoading) return

        // 1. If song has no lyrics, handle fallback status
        if (!playbackState.hasLyrics || !lyrics || !lyrics.lines.length || lyrics.lines.every((line) => !line.text.trim())) {
            playbackState.currentLine = null

            if (Date.now() < this.rateLimitResetTime) return

            const songName = playbackState.songName
            if (!songName) return

            const key = `song-fallback:${playbackState.songId}:${songName}`
            if (this.lastStatusKey !== key) {
                // Check proactive rate limit & dynamic interval
                this.sentTimestamps = this.sentTimestamps.filter(t => Date.now() - t < 10000)
                if (this.sentTimestamps.length >= 4) {
                    this.dynamicMinSendInterval = Math.max(this.dynamicMinSendInterval, 2500)
                }

                if (Date.now() - this.lastSentTime >= this.dynamicMinSendInterval) {
                    this.sendStatus(songName, "\uD83C\uDFB6", key)
                }
            }
            return
        }

        // 2. Find the active line based on song progress and offset
        const songProgress = playbackState.songProgress
        const lines = lyrics.lines
        const offset = Settings.timings.sendTimeOffset
        let activeLine: LyricsLine | null = null

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const nextLine = lines[i + 1]

            if (line.time < (songProgress + offset)) {
                if (nextLine && nextLine.time < (songProgress + offset)) continue
                activeLine = line
                break
            }
        }

        // 3. Update in-app playback state instantly for smooth sync
        playbackState.currentLine = activeLine

        // 4. If we are rate limited, don't make any network calls to Discord
        if (Date.now() < this.rateLimitResetTime) return

        // 5. Determine Discord status key and text
        if (activeLine) {
            if (!activeLine.text.trim()) {
                // Instrumental line
                const key = `instrumental:${playbackState.songId}:${activeLine.time}`
                if (this.lastStatusKey !== key) {
                    // Check proactive rate limit & dynamic interval
                    this.sentTimestamps = this.sentTimestamps.filter(t => Date.now() - t < 10000)
                    if (this.sentTimestamps.length >= 4) {
                        this.dynamicMinSendInterval = Math.max(this.dynamicMinSendInterval, 2500)
                    }

                    if (Date.now() - this.lastSentTime >= this.dynamicMinSendInterval) {
                        this.sendStatus("", "\uD83C\uDFB6", key)
                    }
                }
            } else {
                // Normal lyric line
                const key = `line:${playbackState.songId}:${activeLine.time}:${activeLine.text}`
                if (this.lastStatusKey !== key) {
                    // Check proactive rate limit & dynamic interval
                    this.sentTimestamps = this.sentTimestamps.filter(t => Date.now() - t < 10000)
                    if (this.sentTimestamps.length >= 4) {
                        this.dynamicMinSendInterval = Math.max(this.dynamicMinSendInterval, 2500)
                    }

                    if (Date.now() - this.lastSentTime >= this.dynamicMinSendInterval) {
                        const text = Settings.view.advanced.enabled
                            ? this.parseStatusString(Settings.view.advanced.customStatus)
                            : this.getStatusString(activeLine)
                        const emoji = Settings.view.advanced.enabled
                            ? Settings.view.advanced.customEmoji
                            : "\uD83C\uDFB6"
                        this.sendStatus(text, emoji, key)
                    }
                }
            }
        } else {
            // Intro section
            const key = `instrumental:${playbackState.songId}:intro`
            if (this.lastStatusKey !== key) {
                // Check proactive rate limit & dynamic interval
                this.sentTimestamps = this.sentTimestamps.filter(t => Date.now() - t < 10000)
                if (this.sentTimestamps.length >= 4) {
                    this.dynamicMinSendInterval = Math.max(this.dynamicMinSendInterval, 2500)
                }

                if (Date.now() - this.lastSentTime >= this.dynamicMinSendInterval) {
                    this.sendStatus("", "\uD83C\uDFB6", key)
                }
            }
        }
    }

    public songChanged(): void {
        this.sentLines = []
        this.lastStatusKey = ""
    }

    public formatSeconds(s: number): string {
        return (s - (s %= 60)) / 60 + (9 < s ? ':' : ':0' ) + s
    }

    public getStatusString(line: LyricsLine): string {
        return `${Settings.view.timestamp ? `[${this.formatSeconds(+(line.time / 1000).toFixed(0))}] ` : ""}${Settings.view.label ? "Lời bài hát - " : ""}${line.text.replace("\u266A", "\uD83C\uDFB6")}`.slice(0, 128)
    }

    public parseStatusString(status: string): string {
        if(this.playbackState.currentLine) {
            const line = this.playbackState.currentLine
            const songName = this.playbackState.songName
            const songAuthor = this.playbackState.songAuthor

            status = status
                .replace("{lyrics}", line.text)
                .replace("{lyrics_upper}", line.text.toUpperCase())
                .replace("{lyrics_lower}", line.text.toLowerCase())
                .replace("{lyrics_letters_only}", line.text.replace(/['",\.]/gi, ""))
                .replace("{lyrics_upper_letters_only}", line.text.toUpperCase().replace(/['",\.]/gi, ""))
                .replace("{lyrics_lower_letters_only}", line.text.toLowerCase().replace(/['",\.]/gi, ""))
                .replace("\u266A", "\uD83C\uDFB6")
                .replace("{timestamp}", this.formatSeconds(+(line.time / 1000).toFixed()))
                .replace("{song_name}", songName)
                .replace("{song_name_upper}", songName.toUpperCase())
                .replace("{song_name_lower}", songName.toLowerCase())
                .replace("{song_name_cropped}", songName.replace(/( ?- ?.+)|(\(.+\))/gi, ""))
                .replace("{song_name_upper_cropped}", songName.toUpperCase().replace(/( ?- ?.+)|(\(.+\))/gi, ""))
                .replace("{song_name_lower_cropped}", songName.toLowerCase().replace(/( ?- ?.+)|(\(.+\))/gi, ""))
                .replace("{song_author}", songAuthor)
                .replace("{song_author_upper}", songAuthor.toUpperCase())
                .replace("{song_author_lower}", songAuthor.toLowerCase());
        }

        return status.slice(0, 128);
    }

    private clearStatusOnce(): void {
        if (this.lastStatusKey === "clear") return

        this.lastStatusKey = "clear"
        this.sentLines = []
        
        if (Date.now() < this.rateLimitResetTime) return

        this.sentTimestamps.push(Date.now())
        this.clearStatusRequest(Settings.credentials.token)
            .catch((e) => {
                Debug.write("Discord status clear failed: " + e.stack)
                this.lastStatusKey = ""
                this.isRequestPending = false
            })
    }

    private sendStatus(text: string | null, emoji: string, key: string): void {
        if (this.lastStatusKey === key) return

        this.lastStatusKey = key
        this.sentTimestamps.push(Date.now())
        this.changeStatusRequest(text === null ? null : text.slice(0, 128), Settings.credentials.token, emoji)
            .catch((e) => {
                Debug.write("Discord status update failed: " + e.stack)
                this.lastStatusKey = ""
                this.isRequestPending = false
            })
    }

    private updateAutoOffsetSetting(): void {
        if (!Settings.timings.enableAutooffset) return

        const dynamicLimit = this.autooffset.getVarianceLimit()
        const average = this.autooffset.getAverageValue(dynamicLimit)
        if (!Number.isFinite(average) || average <= 0) return

        const measuredOffset = Math.max(50, Math.min(2000, Math.round(average + 100)))
        if (Math.abs(measuredOffset - this.lastSavedAutoOffset) < 25) return

        Settings.timings.sendTimeOffset = measuredOffset
        this.lastSavedAutoOffset = measuredOffset
        Settings.save()
        broadcastSettings()
    }
}
