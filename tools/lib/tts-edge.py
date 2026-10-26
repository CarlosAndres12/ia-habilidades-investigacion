# Edge TTS bridge for lib/tts-edge.mjs: reads {text, voice, rate, pitch, out} as JSON on stdin, writes
# the MP3 (24 kHz mono) to `out` and prints the word boundaries as JSON: [{"text", "sec"}].
import asyncio
import json
import sys

import edge_tts


async def main():
    job = json.load(sys.stdin)
    com = edge_tts.Communicate(job["text"], job["voice"], rate=job["rate"], pitch=job["pitch"], boundary="WordBoundary")
    words = []
    with open(job["out"], "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append({"text": chunk["text"], "sec": chunk["offset"] / 1e7})
    json.dump(words, sys.stdout)


asyncio.run(main())
