import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface ExtractedStreamResult {
  streamUrl: string;
  title: string;
  duration?: number;
  thumbnail?: string;
  quality: string;
  extractor?: string;
  webpageUrl: string;
  formatNote?: string;
}

export class StreamExtractorService {
  private static resolveCommand(): { command: string; prefixArgs: string[] } {
    const isWindows = process.platform === 'win32';
    const localBinName = isWindows ? 'yt-dlp.exe' : 'yt-dlp';
    const possiblePaths = [
      path.join(__dirname, '..', '..', 'bin', localBinName),
      path.join(process.cwd(), 'bin', localBinName),
      path.join(process.cwd(), 'backend', 'bin', localBinName),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return { command: p, prefixArgs: [] };
      }
    }

    // Check if yt-dlp is in system PATH
    try {
      const testCmd = isWindows ? 'where yt-dlp' : 'which yt-dlp';
      execSync(testCmd, { stdio: 'ignore' });
      return { command: 'yt-dlp', prefixArgs: [] };
    } catch {}

    // Check python3 (Linux standard on Render)
    try {
      execSync('python3 -m yt_dlp --version', { stdio: 'ignore' });
      return { command: 'python3', prefixArgs: ['-m', 'yt_dlp'] };
    } catch {}

    // Check python (Windows standard)
    try {
      execSync('python -m yt_dlp --version', { stdio: 'ignore' });
      return { command: 'python', prefixArgs: ['-m', 'yt_dlp'] };
    } catch {}

    return {
      command: isWindows ? 'python' : 'python3',
      prefixArgs: ['-m', 'yt_dlp'],
    };
  }

  /**
   * Extract direct stream URL and metadata using yt-dlp
   */
  public static async extractStream(rawUrl: string): Promise<ExtractedStreamResult> {
    let targetUrl = rawUrl.trim();
    if (!targetUrl) {
      throw new Error('Video URL is required.');
    }

    // Auto-unwrap redirect query params (?url=..., ?redirect=..., ?target=...)
    try {
      const parsed = new URL(targetUrl);
      const inner =
        parsed.searchParams.get('url') ||
        parsed.searchParams.get('redirect') ||
        parsed.searchParams.get('target') ||
        parsed.searchParams.get('dest') ||
        parsed.searchParams.get('link');

      if (inner) {
        const decoded = decodeURIComponent(inner);
        if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
          targetUrl = decoded;
        } else if (decoded.startsWith('/')) {
          targetUrl = `${parsed.origin}${decoded}`;
        }
      }
    } catch {}

    // Check if it's already a direct media file
    const cleanLower = targetUrl.split('?')[0].toLowerCase();
    const isDirectMedia =
      cleanLower.endsWith('.mp4') ||
      cleanLower.endsWith('.webm') ||
      cleanLower.endsWith('.m3u8') ||
      cleanLower.endsWith('.mov') ||
      cleanLower.endsWith('.mkv');

    if (isDirectMedia) {
      const filename = path.basename(targetUrl.split('?')[0]);
      return {
        streamUrl: targetUrl,
        title: decodeURIComponent(filename) || 'Direct Video Stream',
        quality: cleanLower.endsWith('.m3u8') ? 'Auto Adaptive (HLS)' : '1080p Full HD',
        extractor: cleanLower.endsWith('.m3u8') ? 'HLS Stream' : 'Direct File',
        webpageUrl: targetUrl,
      };
    }

    // Execute resolved yt-dlp command
    const { command, prefixArgs } = StreamExtractorService.resolveCommand();
    return new Promise((resolve, reject) => {
      const args = [
        ...prefixArgs,
        '--dump-single-json',
        '--no-playlist',
        '--no-warnings',
        '--no-check-certificate',
        '--prefer-free-formats',
        '--socket-timeout',
        '15',
        targetUrl,
      ];

      const child = spawn(command, args, {
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';

      const timeoutId = setTimeout(() => {
        child.kill();
        const err: any = new Error('Stream extraction timed out after 30 seconds.');
        err.statusCode = 408;
        err.code = 'EXTRACT_TIMEOUT';
        reject(err);
      }, 30000);

      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', (err) => {
        clearTimeout(timeoutId);
        const error: any = new Error(`Failed to run yt-dlp extractor: ${err.message}`);
        error.statusCode = 500;
        reject(error);
      });

      child.on('close', (code) => {
        clearTimeout(timeoutId);

        let errHint = '';
        if (stderr) {
          const errorLines = stderr
            .split('\n')
            .map((s) => s.trim())
            .filter((s) => s.startsWith('ERROR:') || s.includes('HTTP Error') || s.includes('Unable to download'));
          errHint = errorLines.pop() || stderr.split('\n').filter(Boolean).pop() || '';
          errHint = errHint.replace(/^ERROR:\s*(\[[^\]]+\])?\s*/i, '');
        }

        if (code !== 0 || !stdout || stdout.trim() === 'null') {
          const message = errHint
            ? `Stream extractor: ${errHint}`
            : 'Could not extract a stream from this link. The video may be deleted (404), private, or protected by anti-bot verification.';
          const error: any = new Error(message);
          error.statusCode = 400;
          error.code = 'EXTRACT_FAILED';
          return reject(error);
        }

        try {
          const data = JSON.parse(stdout);

          if (!data || typeof data !== 'object') {
            const error: any = new Error(
              errHint || 'The video provider returned no media data. The video may be deleted, private, or region-restricted.'
            );
            error.statusCode = 400;
            error.code = 'EXTRACT_FAILED';
            return reject(error);
          }

          // Find the best stream URL:
          // 1. Prefer HLS .m3u8 format for robust cross-quality streaming
          const formats = Array.isArray(data.formats) ? data.formats : [];
          const hlsFormat = formats.find(
            (f: any) =>
              (f.protocol && (f.protocol.includes('m3u8') || f.protocol === 'm3u8_native')) ||
              (f.url && f.url.includes('.m3u8')) ||
              (f.format_id && f.format_id.includes('hls'))
          );

          // 2. Direct combined video + audio format
          const directFormat = formats
            .filter((f: any) => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none' && f.url)
            .pop();

          // 3. Fallback to top-level URL
          const streamUrl = hlsFormat?.url || directFormat?.url || data.url || data.requested_formats?.[0]?.url;

          if (!streamUrl) {
            return reject(new Error('No compatible stream URL could be found for this video.'));
          }

          // Format quality label
          let quality = '1080p Full HD';
          if (data.height) {
            if (data.height >= 2160) quality = '4K Ultra HD';
            else if (data.height >= 1440) quality = '2K Quad HD';
            else if (data.height >= 1080) quality = '1080p Full HD';
            else if (data.height >= 720) quality = '720p HD';
            else quality = `${data.height}p`;
          } else if (hlsFormat) {
            quality = 'Auto Adaptive (HLS)';
          }

          resolve({
            streamUrl,
            title: data.title || 'Extracted Video Stream',
            duration: typeof data.duration === 'number' ? Math.round(data.duration) : undefined,
            thumbnail: data.thumbnail || undefined,
            quality,
            extractor: data.extractor || 'Web Video',
            webpageUrl: targetUrl,
            formatNote: hlsFormat ? 'HLS Master Stream' : (directFormat?.format_note || 'Direct Video Stream'),
          });
        } catch (parseErr: any) {
          reject(new Error(`Failed to parse extracted stream metadata: ${parseErr.message}`));
        }
      });
    });
  }
}
