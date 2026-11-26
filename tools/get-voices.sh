#!/bin/bash
# Download the Piper scratch voice (used for test cuts before the ElevenLabs take).
set -e
cd "$(dirname "$0")"
mkdir -p voices
for f in en_US-ryan-high.onnx en_US-ryan-high.onnx.json; do
  [ -s "voices/$f" ] || curl -sSL -o "voices/$f" "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/high/$f" || echo "voice download failed: $f"
done
