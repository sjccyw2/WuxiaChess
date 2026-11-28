# Calls the OpenAI Images API (key injected by the session proxy). Text-only or with reference images.
import json, sys, base64, urllib.request, uuid, time
H = {"Authorization": "Bearer proxy-injected"}
def _post(url, body, ctype):
    req = urllib.request.Request(url, data=body, headers={**H, "Content-Type": ctype})
    return json.load(urllib.request.urlopen(req, timeout=600))
def generate(prompt, size, out, refs=(), transparent=False, model="gpt-image-2.6-flare"):
    err = None
    for attempt in range(3):
        try:
            if refs:
                b = uuid.uuid4().hex; parts = []
                def field(n, v): parts.append(f'--{b}\r\nContent-Disposition: form-data; name="{n}"\r\n\r\n{v}\r\n'.encode())
                field("model", model); field("prompt", prompt); field("size", size); field("n", "1")
                if transparent: field("background", "transparent"); field("output_format", "png")
                for r in refs:
                    parts.append(f'--{b}\r\nContent-Disposition: form-data; name="image[]"; filename="ref.png"\r\nContent-Type: image/png\r\n\r\n'.encode() + open(r, "rb").read() + b"\r\n")
                parts.append(f"--{b}--\r\n".encode())
                r = _post("https://api.openai.com/v1/images/edits", b"".join(parts), f"multipart/form-data; boundary={b}")
            else:
                body = {"model": model, "prompt": prompt, "size": size, "n": 1}
                if transparent: body.update(background="transparent", output_format="png")
                r = _post("https://api.openai.com/v1/images/generations", json.dumps(body).encode(), "application/json")
            d = r["data"][0]
            open(out, "wb").write(base64.b64decode(d["b64_json"]) if "b64_json" in d else urllib.request.urlopen(d["url"]).read())
            return f"{out} ok ({r.get('background')}, {r.get('size')})"
        except urllib.error.HTTPError as e:
            err = f"{e.code} {e.read().decode()[:400]}"
            if e.code == 400: break
        except Exception as e:
            err = repr(e)
        time.sleep(5 * (attempt + 1))
    return f"{out} FAILED {err}"
