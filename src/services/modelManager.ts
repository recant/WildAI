import RNFS from 'react-native-fs';
import {
  MODEL_FILENAME,
  MMPROJ_FILENAME,
  MODEL_DOWNLOAD_URL,
  MMPROJ_DOWNLOAD_URL,
  MODEL_APPROX_SIZE_BYTES,
  MMPROJ_APPROX_SIZE_BYTES,
} from '../constants/modelConfig';

export const getModelPath = () => `${RNFS.DocumentDirectoryPath}/${MODEL_FILENAME}`;
export const getMmprojPath = () => `${RNFS.DocumentDirectoryPath}/${MMPROJ_FILENAME}`;

export async function isModelReady(): Promise<boolean> {
  const [modelExists, mmprojExists] = await Promise.all([
    RNFS.exists(getModelPath()),
    RNFS.exists(getMmprojPath()),
  ]);
  return modelExists && mmprojExists;
}

export type DownloadProgress = {
  label: string;
  fraction: number; // 0..1 across both files combined
};

const MAX_ATTEMPTS = 5;

async function downloadOnce(
  url: string,
  tmpFile: string,
  approxSizeBytes: number,
  onOverallProgress: (fractionOfThisFile: number) => void,
): Promise<number> {
  const { promise } = RNFS.downloadFile({
    fromUrl: url,
    toFile: tmpFile,
    progressDivider: 2,
    progress: res => {
      const total = res.contentLength > 0 ? res.contentLength : approxSizeBytes;
      onOverallProgress(Math.min(res.bytesWritten / total, 1));
    },
  });
  const result = await promise;
  return result.statusCode;
}

/**
 * This connection has repeatedly shown itself to be slow and prone to
 * mid-transfer aborts (same symptom hit the Gradle build earlier), so we
 * retry the whole file a few times with backoff rather than failing once.
 */
async function downloadOne(
  url: string,
  toFile: string,
  approxSizeBytes: number,
  label: string,
  onOverallProgress: (fractionOfThisFile: number) => void,
): Promise<void> {
  if (await RNFS.exists(toFile)) {
    onOverallProgress(1);
    return;
  }
  const tmpFile = `${toFile}.part`;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const statusCode = await downloadOnce(url, tmpFile, approxSizeBytes, onOverallProgress);
      if (statusCode !== 200) {
        throw new Error(`${label} download failed with status ${statusCode}`);
      }
      await RNFS.moveFile(tmpFile, toFile);
      return;
    } catch (e) {
      lastError = e;
      await RNFS.unlink(tmpFile).catch(() => {});
      if (attempt < MAX_ATTEMPTS) {
        await new Promise<void>(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * Downloads the GGUF model and mmproj projector into app document storage
 * if not already present. Reports combined progress across both files.
 */
export async function ensureModelDownloaded(
  onProgress?: (progress: DownloadProgress) => void,
): Promise<void> {
  const modelWeight = MODEL_APPROX_SIZE_BYTES;
  const mmprojWeight = MMPROJ_APPROX_SIZE_BYTES;
  const totalWeight = modelWeight + mmprojWeight;

  await downloadOne(MODEL_DOWNLOAD_URL, getModelPath(), modelWeight, 'model', frac => {
    onProgress?.({
      label: 'Downloading language+vision model…',
      fraction: (frac * modelWeight) / totalWeight,
    });
  });

  await downloadOne(MMPROJ_DOWNLOAD_URL, getMmprojPath(), mmprojWeight, 'mmproj', frac => {
    onProgress?.({
      label: 'Downloading vision projector…',
      fraction: (modelWeight + frac * mmprojWeight) / totalWeight,
    });
  });
}
