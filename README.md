# WildAI

On-device AI camping assistant. Take a photo of your gear, get a step-by-step plan.

## Tech Stack
- **Model:** LFM2.5-VL-450M (Liquid AI) — vision-language, 450M params
- **Format:** GGUF (Q4_K_M quantization)
- **Runtime:** llama.cpp / llama.rn
- **App:** React Native (Android-first)

## Model Files (not in repo — download separately)
Get from Google Drive (link in team chat):
- `LFM2.5-VL-450M-Q4_K_M.gguf` (~280 MB)
- `mmproj-LFM2.5-VL-450m-Q8_0.gguf` (~99 MB)

## WSL Development Server
```bash
llama-server \
    -m ~/models/lfm25-vl-450m/LFM2.5-VL-450M-Q4_K_M.gguf \
    --mmproj ~/models/lfm25-vl-450m/mmproj-LFM2.5-VL-450m-Q8_0.gguf \
    -c 4096 --port 8080 -ngl 99
```

## Test
```bash
pip install openai
python app.py
```
