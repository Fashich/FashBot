Image generation (local and fallback) — README

Overview

This project includes a local-first image generation flow used by the endpoint POST /api/generate/image. The server will attempt the following in order when handling an image generation request (body: { prompt, size?, local? }):

1. Heavy local models (if available):
   - models/lima/gen_images.py (StyleGAN3-style script) — expects network pickle weights and PyTorch/CUDA.
   - models/tiga/src/examples/demo.py (Qwen Image pipeline) — uses diffusers and expects pre-trained models.
2. Lightweight CPU fallback Python script (models/local/generate_cpu_image.py) — pure-Pillow generator that returns a data:image/png;base64 URI. Works on CPU without heavy dependencies.
3. JS generator fallback (existing local JS SVG/placeholder generator) — returns a data:image/svg+xml URI.
4. Remote providers (Gemini, FAL, etc.) as a final fallback (existing behavior). The server sends provider attempts and errors in the response for debugging.

How the server runs Python scripts

- The server runs Python scripts by spawning a child process (PYTHON_BIN env or python3). It writes a single JSON object to the script's stdin and expects JSON on stdout. The script should return a JSON object with one of these fields:
  - dataUri (string) — a data URI starting with data:image/...
  - data_uri / output / content — accepted aliases
  - image (string) — raw base64 (PNG) will be converted to data:image/png;base64,...
  - text (string) — an https:// URL will be returned as-is

- The server sets CUDA_VISIBLE_DEVICES='' for spawned processes to avoid accidental GPU usage by default. If you want GPU and the environment supports it, adjust this behavior carefully.

Required environment variables

- PYTHON_BIN (optional): absolute path or name of the python binary to use (default: python3)
- GEMINI_API_KEY, FAL_API_KEY, OPENAI_API_KEY, etc. — kept unchanged; remote provider fallbacks still respect their env vars.

Installing dependencies for heavy models

- models/lima (StyleGAN / gen_images.py)
  - See models/lima/README.md for exact requirements. Typical deps: dnnlib, torch, numpy, pillow. This script usually expects a GPU and network pickle weights.

- models/tiga (Qwen Image)
  - Typical deps: diffusers, transformers, torch. The demo pipeline expects model weights available via from_pretrained.

- For a minimal CPU-only test you only need Python and pillow for the lightweight fallback:
  - pip install Pillow

Security & operational notes

- Never commit model weights or secrets to the repository.
- The Python scripts are executed with the same user as the server — make sure the code is trusted and sandboxed.
- Timeouts are applied to spawned Python scripts to avoid long-running requests (adjust in server/routes/generate.ts if needed).
- If you expose this server publicly, put an authentication layer in front of /api/generate/image to avoid abuse (rate-limit + API key + auth).

Testing the endpoint

- Quick test (from the server host):
  curl -X POST "http://localhost:8080/api/generate/image" -H "Content-Type: application/json" -d '{"prompt":"a friendly robot","size":"800x600"}'

- To force only local processing (do not fall back to remote providers), supply {"local": true} in the body.

Saved generated images

- Generated images are saved to the project folder generated_images/ and served at the URL path /generated/<filename>.
- When an image is successfully saved, the API response includes saved: "/generated/<filename>" and content will point to that public path so the client can display it.

Next steps you can ask me to do

- Install a minimal Python runtime and Pillow to validate the CPU fallback in this environment.
- Hook a storage provider (Supabase/Neon) to persist generated images and metadata.
- Add Sentry for server-side error logging (SENTRY_DSN env var). The server will initialize Sentry automatically when SENTRY_DSN is set.
- Add authentication + rate-limiting for the /api/generate/image endpoint.

If you want I can implement any of the next steps; tell me which one and I will proceed.
