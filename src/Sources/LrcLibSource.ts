import { BaseSource, SongLyrics } from "./BaseSource"

interface LyricsResponse {
    id: number
    name: string
    trackName: string
    artistName: string
    albumName: string
    plainLyrics: string | null
    syncedLyrics: string | null
}

/**
 * Lyrics but using LrcLib
 * https://lrclib.net/api
 */
export class LrcLibSource extends BaseSource {
    private readonly baseUrl = "https://lrclib.net/api"

        public async getLyrics(name: string, artist: string): Promise<SongLyrics> {
            const cleanQuery = `${name} ${artist}`
                .replace(/(?:^|[\s,])(?:và|&|feat\.?|ft\.?|with)(?=[\s,]|$)/gi, " ")
                .replace(/\s*,\s*/g, " ")
                .replace(/\s+/g, " ")
                .trim()

            const getUrl = `${this.baseUrl}/get?track_name=${encodeURIComponent(name)}&artist_name=${encodeURIComponent(artist)}`
            const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(cleanQuery)}`
            const headers = {
                "User-Agent": "DiscordLyrics/1.0.0 (contact@discordlyrics.local)"
            }

            // Fetch both in parallel to reduce response times
            const [getRes, searchRes] = await Promise.allSettled([
                fetch(getUrl, { headers }),
                fetch(searchUrl, { headers })
            ])

            // 1. Try to use exact get result first
            if (getRes.status === "fulfilled" && getRes.value.ok) {
                try {
                    const json = (await getRes.value.json()) as LyricsResponse
                    if (json.syncedLyrics && json.syncedLyrics.trim()) {
                        return this.normalizeLyrics(this.parseLyrics(json.syncedLyrics), name, artist)
                    }
                } catch (e) {}
            }

            // 2. Fallback to search result
            if (searchRes.status === "fulfilled" && searchRes.value.ok) {
                try {
                    const results = (await searchRes.value.json()) as LyricsResponse[]
                    if (results && results.length > 0) {
                        const bestResult = results.find((r) => r.syncedLyrics && r.syncedLyrics.trim())
                        if (bestResult && bestResult.syncedLyrics) {
                            return this.normalizeLyrics(this.parseLyrics(bestResult.syncedLyrics), name, artist)
                        }
                    }
                } catch (e) {}
            }

            throw new Error("No synced lyrics found on LrcLib")
        }

        /**
         * Convert the response to the .json format we use
         */
        private parseLyrics(lyrics: string): SongLyrics {
            const result: SongLyrics = { lines: [] }
            const lines = lyrics.split("\n")

            // it should be: [mm:ss.xx] text
            const regexp = /\[(\d\d):(\d\d)(?:\.(\d\d))?]/g

            for (let line of lines) {
                if (!line.trim()) continue

                    const timestamps: number[] = []
                    let match: RegExpExecArray | null

                    while ((match = regexp.exec(line)) !== null) {
                        const min = parseInt(match[1])
                        const sec = parseInt(match[2])
                        const ms = match[3] ? parseInt(match[3]) * 10 : 0
                        timestamps.push((min * 60 + sec) * 1000 + ms)
                    }

                    const text = line.replace(regexp, "").trim()

                    for (const time of timestamps.length ? timestamps : [0]) {
                        result.lines.push({ time, text })
                    }
            }

            result.lines.sort((a, b) => a.time - b.time)
            return result
        }

        public getAppName(): string {
            return "LrcLib"
        }
}
