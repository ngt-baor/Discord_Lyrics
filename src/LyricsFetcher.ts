import { BaseSource, CachedSongLyrics, SongLyrics } from "./Sources/BaseSource"
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs"
import { join } from "path"
import { Debug } from "./Debug"

interface LyricsFetchResult {
    lyrics: SongLyrics
    appName: string
}

function getCacheDir(): string {
    const appData = process.env.APPDATA || (process.env.USERPROFILE ? join(process.env.USERPROFILE, "AppData", "Roaming") : process.cwd())

    return join(appData, "DiscordLyrics", "cache")
}

function getCacheFileName(name: string, artist: string): string {
    return Buffer.from(`${name}-${artist}`, "utf-8").toString("base64url") + ".json"
}

function isMetadataLine(text: string, name: string, artist: string): boolean {
    const value = text.trim()
    if (!value) return true

    // Check if it matches title or artist or combination (like title - artist)
    const lowerVal = value.toLowerCase()
    const lowerName = name.trim().toLowerCase()
    const lowerArtist = artist.trim().toLowerCase()

    if (lowerVal === lowerName || lowerVal === lowerArtist) return true
    if (lowerVal.includes(" - ") && (lowerVal.includes(lowerName) || lowerVal.includes(lowerArtist))) return true
    if (lowerVal.includes(" : ") && (lowerVal.includes(lowerName) || lowerVal.includes(lowerArtist))) return true

    const cleanName = lowerName.replace(/\s*[\(\[][^)]*[\)\]]/g, "").trim()
    const cleanArtist = lowerArtist.replace(/\s*[\(\[][^)]*[\)\]]/g, "").trim()

    if (cleanName && lowerVal === cleanName) return true
    if (cleanName && lowerVal.includes(" - ") && lowerVal.includes(cleanName)) return true

    // Check English "by" pattern: e.g., "composed by", "written by", "produced by", "lyrics by", "music by"
    if (/^\s*(?:composed|written|produced|arranged|recorded|mixed|mastered|lyrics|music|words|artwork|visuals)\s+by\b/i.test(value)) {
        return true
    }

    // Check standard colon/dash prefix pattern for metadata categories
    return /^\s*(?:作\s*词|作\s*詞|作\s*曲|编\s*曲|編\s*曲|制\s*作|製\s*作|监\s*制|監\s*製|和\s*声|和\s*聲|录\s*音|錄\s*音|混\s*音|母\s*带|母\s*帶|歌\s*词|歌\s*詞|企\s*划|企\s*劃|统\s*筹|統\s*籌|出\s*品|词\s*曲|詞\s*曲|词|詞|曲|lrc|composer|lyricist|lyrics?|music|arranger|producer|vocal|guitar|bass|drum|piano|keyboard|mixing|recording|mastering|studio|engineer|op|sp|written|composed|produced|arranged|recorded|mixed|mastered|vocals|drums|keyboards|synthesizer|artwork|designer|publisher|copyright|artist|title|album)\s*[:：\s-]/i.test(value)
}

function cleanSongName(name: string): string {
    let cleaned = name.normalize("NFC").trim()
    cleaned = cleaned.replace(/\s*[\(\[][^)]*[\)\]]/g, "")
    const suffixRegex = /\s*-\s*(?:sped\s*up|slowed|reverb|remix|live|acoustic|radio\s*edit|single\s*version|mix|edit|version|remaster(?:ed)?|\d{4}\s*remaster(?:ed)?)\b.*/i
    cleaned = cleaned.replace(suffixRegex, "")
    return cleaned.trim()
}

function normalizeCachedLyrics(lyrics: CachedSongLyrics, name: string, artist: string): CachedSongLyrics {
    return {
        ...lyrics,
        lines: lyrics.lines
            .map((line) => ({
                time: line.time,
                text: line.text.trim() || "♪"
            }))
            .filter((line) => !isMetadataLine(line.text, cleanSongName(name), artist))
            .sort((a, b) => a.time - b.time)
    }
}

export class LyricsFetcher {
    public sources: BaseSource[]

    public lastFetchedFrom: string
    public lastFetchedFor: string

    private readonly cacheDir: string
    private readonly sourceTimeoutMs = 15000

    constructor() {
        this.sources = []

        this.lastFetchedFrom = "Not fetched"
        this.lastFetchedFor = ""
        this.cacheDir = getCacheDir()
    }

    public addSource(source: BaseSource): void {
        this.sources.push(source)
    }

    public async fetchLyrics(name: string, artist: string, activeSource: string = "spotify", isFallback: boolean = false): Promise<SongLyrics | null> {
        name = cleanSongName(name.normalize("NFC").trim())
        artist = artist.normalize("NFC").trim()
        this.lastFetchedFrom = "Not fetched"
        this.lastFetchedFor = name + artist

        const cache = this.fetchCachedLyrics(name, artist)

        if (cache) {
            let isCacheValid = false
            if (activeSource === "spotify") {
                if (isFallback) {
                    isCacheValid = cache.appName !== "Spotify"
                } else {
                    isCacheValid = cache.appName === "Spotify"
                }
            } else {
                isCacheValid = cache.appName !== "Spotify"
            }

            if (isCacheValid) {
                this.lastFetchedFrom = `Cache (${cache.appName})`

                return cache
            }
        }

        for (const source of this.sources) {
            const appName = source.getAppName()
            let shouldTrySource = false

            if (activeSource === "spotify") {
                if (isFallback) {
                    shouldTrySource = appName !== "Spotify"
                } else {
                    shouldTrySource = appName === "Spotify"
                }
            } else {
                shouldTrySource = appName !== "Spotify"
            }

            if (!shouldTrySource) continue

            try {
                const result = await this.fetchFromSource(source, name, artist)
                this.lastFetchedFrom = result.appName
                this.cacheLyrics(name, artist, result.lyrics, result.appName)
                return result.lyrics
            } catch (e) {
                Debug.write(`Failed to fetch lyrics from ${source.getAppName()}: ${(e as Error).message || e}`)
            }
        }

        return null
    }

    public fetchCachedLyrics(name: string, artist: string): CachedSongLyrics | null {
        name = cleanSongName(name.normalize("NFC").trim())
        artist = artist.normalize("NFC").trim()
        const cacheFileName = getCacheFileName(name, artist)
        const legacyPath = `./cache/${name}-${artist}.json`
        const paths = [
            join(this.cacheDir, cacheFileName),
            legacyPath
        ]

        for (const path of paths) {
            try {
                const lyrics = normalizeCachedLyrics(JSON.parse(readFileSync(path).toString()) as CachedSongLyrics, name, artist)

                if (lyrics && Array.isArray(lyrics.lines) && lyrics.lines.length) return lyrics
            } catch {}
        }

        return null
    }

    public cacheLyrics(name: string, artist: string, lyrics: SongLyrics, appName: string): void {
        name = cleanSongName(name.normalize("NFC").trim())
        artist = artist.normalize("NFC").trim()
        if (!existsSync(this.cacheDir)) mkdirSync(this.cacheDir, { recursive: true })

        writeFileSync(join(this.cacheDir, getCacheFileName(name, artist)), JSON.stringify({
            ...lyrics,
            appName
        }))
    }

    private async fetchFromSource(source: BaseSource, name: string, artist: string): Promise<LyricsFetchResult> {
        const appName = source.getAppName()
        const timeout = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`${appName} timed out`)), this.sourceTimeoutMs)
        })
        const lyrics = await Promise.race([
            source.getLyrics(name, artist),
            timeout
        ])

        if (!lyrics || !lyrics.lines.length || lyrics.lines.every((line) => !line.text.trim())) {
            throw new Error(`${appName} returned empty lyrics`)
        }

        return {
            lyrics,
            appName
        }
    }
}
