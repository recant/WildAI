/**
 * Model + inference configuration for LFM2.5-VL-450M, per the TrailSense AI
 * technical spec (§5.2). mmproj only ships at Q8_0/F16/BF16/F32 upstream —
 * there is no low-quant mmproj, the vision projector stays higher precision.
 */

const HF_REPO = 'LiquidAI/LFM2.5-VL-450M-GGUF';
const HF_RESOLVE_BASE = `https://huggingface.co/${HF_REPO}/resolve/main`;

export const MODEL_FILENAME = 'LFM2.5-VL-450M-Q4_K_M.gguf';
export const MMPROJ_FILENAME = 'mmproj-LFM2.5-VL-450m-Q8_0.gguf';

export const MODEL_DOWNLOAD_URL = `${HF_RESOLVE_BASE}/${MODEL_FILENAME}`;
export const MMPROJ_DOWNLOAD_URL = `${HF_RESOLVE_BASE}/${MMPROJ_FILENAME}`;

// Approximate sizes (bytes), used only to render download progress before
// the real Content-Length header is known. Verified via HEAD request against
// the resolve URLs (the model card's advertised mmproj size was inaccurate).
export const MODEL_APPROX_SIZE_BYTES = 229313568;
export const MMPROJ_APPROX_SIZE_BYTES = 102815168;

export const INFERENCE_PARAMS = {
  n_ctx: 4096,
  temperature: 0.1,
  top_k: 50,
  repeat_penalty: 1.05,
  n_predict: 1024,
  // The spec's n_gpu_layers: 99 targets Apple Metal on iOS. llama.rn's
  // prebuilt Android binary has no GPU delegate equivalent, so we run
  // CPU-only here; revisit when building the iOS target on a Mac.
  n_gpu_layers: 0,
};
