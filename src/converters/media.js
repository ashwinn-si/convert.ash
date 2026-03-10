import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpeg = null;

async function initFFmpeg() {
  if (ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: await import('@ffmpeg/core?url').then(m => m.default),
    wasmURL: await import('@ffmpeg/core/wasm?url').then(m => m.default),
  });
  return ffmpeg;
}

export function canConvert(from, to) {
  const mediaFormats = ['mp4', 'webm', 'ogg', 'mp3', 'wav', 'aac', 'm4a', 'flac', 'avi', 'mov', 'mkv'];
  return mediaFormats.includes(from) && mediaFormats.includes(to);
}

export async function convert(file, fromFormat, toFormat, progressCallback) {
  const ff = await initFFmpeg();

  ff.on('progress', ({ progress, time }) => {
    // FFmpeg progress is 0 to 1
    progressCallback(Math.round(progress * 100));
  });

  const inputName = `input.${fromFormat}`;
  const outputName = `output.${toFormat}`;

  await ff.writeFile(inputName, await fetchFile(file));

  // Execute conversion
  await ff.exec(['-i', inputName, outputName]);

  const data = await ff.readFile(outputName);

  // Cleanup
  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);

  let mimeType = 'application/octet-stream';
  if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv'].includes(toFormat)) mimeType = `video/${toFormat}`;
  if (['mp3', 'wav', 'aac', 'm4a', 'flac'].includes(toFormat)) mimeType = `audio/${toFormat}`;

  return new Blob([data.buffer], { type: mimeType });
}
