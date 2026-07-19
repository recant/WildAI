import { initLlama, LlamaContext } from 'llama.rn';
import { INFERENCE_PARAMS } from '../constants/modelConfig';
import { SYSTEM_PROMPT } from '../constants/prompts';
import { getModelPath, getMmprojPath } from './modelManager';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
};

let context: LlamaContext | null = null;
let history: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];

export async function initContext(): Promise<void> {
  if (context) return;

  context = await initLlama({
    model: getModelPath(),
    n_ctx: INFERENCE_PARAMS.n_ctx,
    n_gpu_layers: INFERENCE_PARAMS.n_gpu_layers,
    ctx_shift: false,
  });

  await context.initMultimodal({
    path: getMmprojPath(),
    use_gpu: false,
  });
}

export async function releaseContext(): Promise<void> {
  await context?.release();
  context = null;
  history = [{ role: 'system', content: SYSTEM_PROMPT }];
}

export function resetConversation(): void {
  history = [{ role: 'system', content: SYSTEM_PROMPT }];
}

/**
 * Sends a user turn (text, optionally with an attached image) and streams
 * the assistant's reply token-by-token. Keeps the growing message history
 * so follow-up turns retain conversational context (spec §5.1 step 6).
 */
export async function sendMessage(
  text: string,
  imageUri: string | null,
  onToken: (partialText: string) => void,
): Promise<string> {
  if (!context) {
    throw new Error('Model context not initialized — call initContext() first.');
  }

  const content: ChatMessage['content'] = imageUri
    ? [
        { type: 'text', text },
        { type: 'image_url', image_url: { url: imageUri } },
      ]
    : text;

  history.push({ role: 'user', content });

  let full = '';
  const result = await context.completion(
    {
      messages: history,
      n_predict: INFERENCE_PARAMS.n_predict,
      temperature: INFERENCE_PARAMS.temperature,
      top_k: INFERENCE_PARAMS.top_k,
      penalty_repeat: INFERENCE_PARAMS.repeat_penalty,
    },
    data => {
      full += data.token;
      onToken(full);
    },
  );

  const finalText = result.text ?? full;
  history.push({ role: 'assistant', content: finalText });
  return finalText;
}
