import { execFile } from "node:child_process"

export interface WindowsMediaPlayback {
    hasSession: boolean
    sourceAppUserModelId?: string
    title?: string
    artist?: string
    playbackStatus?: string
    positionMs?: number
    endTimeMs?: number
}

export class WindowsMediaService {
    private static readonly script = `
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding
$targetSource = '%%TARGET_SOURCE%%'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.IsGenericMethod })[0]
function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}
$managerType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType=WindowsRuntime]
$propsType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType=WindowsRuntime]
$manager = Await ($managerType::RequestAsync()) $managerType
$session = $null
foreach ($candidate in $manager.GetSessions()) {
    $match = $false
    if ($targetSource -eq 'spotify') {
        if ($candidate.SourceAppUserModelId -match 'Spotify') {
            $match = $true
        }
    } else {
        if ($candidate.SourceAppUserModelId -match 'YouTubeMusic|YTM|youtube-music|youtube') {
            $match = $true
        } else {
            $props = Await ($candidate.TryGetMediaPropertiesAsync()) $propsType
            if ($props.Title -match 'YouTube Music' -or $props.Artist -match 'YouTube Music') {
                $match = $true
            }
        }
    }
    if ($match) {
        $session = $candidate
        break
    }
}
if ($null -eq $session) {
    [pscustomobject]@{ hasSession = $false } | ConvertTo-Json -Compress
    exit
}
$props = Await ($session.TryGetMediaPropertiesAsync()) $propsType
$playback = $session.GetPlaybackInfo()
$timeline = $session.GetTimelineProperties()
[pscustomobject]@{
    hasSession = $true
    sourceAppUserModelId = $session.SourceAppUserModelId
    title = $props.Title
    artist = $props.Artist
    playbackStatus = $playback.PlaybackStatus.ToString()
    positionMs = [math]::Round($timeline.Position.TotalMilliseconds)
    endTimeMs = [math]::Round($timeline.EndTime.TotalMilliseconds)
} | ConvertTo-Json -Compress
`

    public static readPlayback(targetSource: string = "spotify"): Promise<WindowsMediaPlayback> {
        const scriptContent = this.script.replace("%%TARGET_SOURCE%%", targetSource)
        return new Promise((resolve, reject) => {
            execFile(
                "powershell.exe",
                ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", scriptContent],
                { windowsHide: true, timeout: 5000 },
                (error, stdout, stderr) => {
                    if (error) return reject(error)

                    try {
                        resolve(JSON.parse(stdout.trim()) as WindowsMediaPlayback)
                    } catch(e) {
                        if (stderr.trim()) {
                            reject(new Error(stderr.trim()))
                        } else {
                            reject(e)
                        }
                    }
                }
            )
        })
    }

    public static controlSession(source: string, action: "play" | "pause"): Promise<void> {
        const script = `
        Add-Type -AssemblyName System.Runtime.WindowsRuntime
        $manager = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetResults()
        foreach ($session in $manager.GetSessions()) {
            $match = $false
            if ('${source}' -eq 'spotify') {
                if ($session.SourceAppUserModelId -match 'Spotify') { $match = $true }
            } elseif ('${source}' -eq 'ytmusic') {
                if ($session.SourceAppUserModelId -match 'YouTubeMusic|YTM|youtube-music|youtube') {
                    $match = $true
                } else {
                    $props = $session.TryGetMediaPropertiesAsync().GetResults()
                    if ($props.Title -match 'YouTube Music' -or $props.Artist -match 'YouTube Music') {
                        $match = $true
                    }
                }
            }
            if ($match) {
                if ('${action}' -eq 'play') {
                    $session.TryPlayAsync() | Out-Null
                } else {
                    $session.TryPauseAsync() | Out-Null
                }
            }
        }
        `
        return new Promise((resolve) => {
            execFile(
                "powershell.exe",
                ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
                { windowsHide: true, timeout: 5000 },
                () => resolve()
            )
        })
    }
}
