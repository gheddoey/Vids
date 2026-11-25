#!/usr/bin/env python3
"""Builds the FILE 11-0829-JX ARG page.

Each stage's HTML is encrypted with a key derived from the previous stage's
answer, so reading the page source does not spoil anything. Answers are only
stored as salted SHA-256 checks. Solutions: docs/jupiter-arg-solutions.md
"""
import base64, hashlib, json, re, pathlib

HERE = pathlib.Path(__file__).parent
ANSWERS = ["110829JX", "HOLLOW", "SOMETHING", "HELLO", "VENTS"]


def norm(s: str) -> str:
    s = re.sub(r"[^A-Z0-9]", "", s.upper())
    if s.startswith("THE") and len(s) > 3:
        s = s[3:]
    for n in range(1, len(s) // 2 + 1):  # HELLOHELLO -> HELLO
        if len(s) % n == 0 and s[:n] * (len(s) // n) == s:
            return s[:n]
    return s


def sha(b: bytes) -> bytes:
    return hashlib.sha256(b).digest()


def encrypt(text: str, answer: str) -> str:
    key = sha(("11-0829-JX/" + answer).encode())
    data = text.encode()
    out = bytearray()
    for i in range(0, len(data), 32):
        block = sha(key + (i // 32).to_bytes(4, "big"))
        out += bytes(a ^ b for a, b in zip(data[i:i + 32], block))
    return base64.b64encode(bytes(out)).decode()


def check(answer: str) -> str:
    return sha(("chk/" + answer).encode()).hex()


def rot(s: str, k: int) -> str:
    return "".join(chr((ord(c) - 65 + k) % 26 + 65) if "A" <= c <= "Z" else c for c in s)


def vigenere(s: str, key: str) -> str:
    out, j = [], 0
    for c in s:
        if "A" <= c <= "Z":
            out.append(chr((ord(c) - 65 + ord(key[j % len(key)]) - 65) % 26 + 65))
            j += 1
        else:
            out.append(c)
    return "".join(out)


MORSE = {"H": "....", "E": ".", "L": ".-..", "O": "---"}

# ---------------------------------------------------------------- stage 1
CALL = ("THIS IS WALDRON. THERE WERE FOUR SEATS AND FOUR OF US. THEN I COUNTED AGAIN. "
        "WATKINS IS NOT ON THE MANIFEST. NOBODY BOARDED IN HIS SEAT. IT HAS BEEN TALKING "
        "TO US FOR NINE MONTHS AND IT KNOWS ALL OF OUR MOTHERS NAMES. WHEN BAKER LIFTED IT, "
        "IT WEIGHED NOTHING. IT WAS HOLLOW. IF THIS REACHES THE GROUND, THE WORD IS WHAT IT WAS.")
assert norm("hollow") == ANSWERS[1]

S1 = f"""
<section class="stage" data-n="1">
  <div class="crumb">FILE 11-0829-JX <span>//</span> 04 / CALL LOG</div>
  <p class="type">ARCHIVE UNSEALED. ACCESS 4 OF 4.</p>
  <div class="kv">
    <b>CALL TRANSMIT</b><i>AUGUST 29, 2011 &nbsp;07:38 AM</i>
    <b>CALLER</b><i>WALDRON, F. (CMDR)</i>
    <b>CHANNEL</b><i>CH 2 // DIRECT</i>
    <b>ENCODING</b><i>SHIFT <em>&middot;</em> OFFSET = CREW</i>
  </div>
  <div class="wave" data-seed="11"></div>
  <pre class="cipher">{rot(CALL, 3)}</pre>
  <div class="conflict">
    <span>CREW</span><span>VERSION A: 4</span><span class="red">VERSION B: 3 (NO WATKINS) <u>CONFLICT</u></span>
  </div>
  <p class="dim">T+00:31 LIVE LINK LOST // RECORDER ONLY</p>
  <form class="gate" data-for="1" autocomplete="off">
    <label for="a1">WHAT WAS IN SEAT FOUR?</label>
    <div class="row"><input id="a1" spellcheck="false" autocapitalize="characters"><button>SUBMIT</button></div>
    <p class="err" aria-live="polite"></p>
  </form>
</section>"""

# ---------------------------------------------------------------- stage 2
S2 = """
<section class="stage" data-n="2">
  <div class="crumb">FILE 11-0829-JX <span>//</span> 02 / PERSONNEL FILES</div>
  <p class="type red">CORRECTION LOGGED. SEAT FOUR RECLASSIFIED: CARGO.</p>
  <div class="files">
    <div class="file"><div class="ph">W</div><div><b>WALDRON, F.</b><i>COMMANDER</i><i class="red">HISTORY: SEE SECTION 08</i></div></div>
    <div class="file void"><div class="ph">&nbsp;</div><div><b>WATKINS, D.</b><i>FLIGHT ENGINEER</i><i class="red">NOT ON MANIFEST</i></div></div>
    <div class="file"><div class="ph">B</div><div><b>BAKER, C.</b><i>SYSTEMS</i><i class="amb">STATUS: POD 2</i></div></div>
    <div class="file"><div class="ph">B</div><div><b>BARTOLOZZI, J.</b><i>COMMS</i><i class="dim">STATUS: NO RECORD</i></div></div>
  </div>
  <div class="dossier">
    <div class="redact">[REDACTED]<small>NO PHOTO ON FILE</small></div>
    <div class="kv">
      <b>NAME</b><i>MATEO O. ALGO</i>
      <b>ROLE</b><i>MISSION SPECIALIST</i>
      <b>RECORDING</b><i>MINIMAL</i>
      <b class="amb">MOVEMENT</b><i class="amb">CONTINUOUS</i>
      <b>INTAKE FORM</b><i>LANG: ES</i>
      <b>NAME SUPPLIED BY</b><i class="red">SUBJECT</i>
    </div>
  </div>
  <pre class="note">INTAKE NOTE, 11/03/2010:
SUBJECT DID NOT HAVE A NAME ON ARRIVAL.
WHEN ASKED, IT LISTENED TO THE CREW TALK FOR SIX HOURS
AND THEN ANSWERED IN THE LANGUAGE OF THE FORM.
THE CLERK TYPED WHAT IT SAID. NOBODY READ IT BACK.</pre>
  <form class="gate" data-for="2" autocomplete="off">
    <label for="a2">READ ITS NAME AGAIN. WHAT DID IT SAY IT WAS?</label>
    <div class="row"><input id="a2" spellcheck="false" autocapitalize="characters"><button>SUBMIT</button></div>
    <p class="err" aria-live="polite"></p>
  </form>
</section>"""

# ---------------------------------------------------------------- stage 3
morse = "   ".join(" ".join(MORSE[c] for c in w) for w in ["HELLO", "HELLO"])
S3 = f"""
<section class="stage" data-n="3">
  <div class="crumb">FILE 11-0829-JX <span>//</span> 07 / SURVIVOR &nbsp;BAKER, C.</div>
  <p class="type">MATEO, OR SOMETHING. CORRECT. IT IS STILL ON THE PAYROLL.</p>
  <pre class="log">*SETTING ESCAPE PODS*
*ASSEMBLING GATLING GUN*
<span class="amb">BAKER: I GOT THE GUN</span>
<span class="red">*GETS GRAZED BY A KIE*</span>
*COUNTING DOWN TIL POD LAUNCH*
<span class="grn">POD 2 &nbsp;LAUNCHED</span></pre>
  <div class="beacon">
    <div class="lamp" data-morse="{morse}"></div>
    <div class="kv">
      <b>POD 2 BEACON</b><i class="grn">ACTIVE (15 YRS)</i>
      <b>RECEIVED</b><i>NIGHTLY, 03:00 UTC</i>
      <b>ORIGIN</b><i class="red">INSIDE THE POD</i>
      <b>CARRIER</b><i><button class="ghost" data-tone>PLAY TONE</button></i>
    </div>
  </div>
  <p class="dim">POD 2 WAS BUILT FOR ONE. THE BEACON HAS BEEN ANSWERED TWICE.</p>
  <form class="gate" data-for="3" autocomplete="off">
    <label for="a3">TRANSCRIBE THE BEACON. WHAT IS IT SAYING?</label>
    <div class="row"><input id="a3" spellcheck="false" autocapitalize="characters"><button>SUBMIT</button></div>
    <p class="err" aria-live="polite"></p>
  </form>
</section>"""

# ---------------------------------------------------------------- stage 4
MEMO = ("MEMORANDUM 11-0829. WE DID NOT FIND LIFE ON EUROPA. LIFE ON EUROPA FOUND US. "
        "IT CAME ABOARD IN NINETEEN EIGHTY ON THE SATURN SLINGSHOT AND RODE HOME IN THE VENTS. "
        "EVERY MISSION SINCE HAS BEEN A RETURN, NOT AN EXPEDITION. EACH CREW TAKES ONE BACK. "
        "WALDRON VOLUNTEERS EVERY TIME. WALDRON COMES BACK EVERY TIME. WALDRON DOES NOT AGE. "
        "THE BROTHER AT THE HEARING WAS NOT A BROTHER. DO NOT OPEN THE VENTS. "
        "DO NOT ANSWER IF IT SAYS HELLO.")
S4 = f"""
<section class="stage" data-n="4">
  <div class="crumb">FILE 11-0829-JX <span>//</span> 08 / PERSONNEL HISTORY &nbsp;WALDRON, F.</div>
  <p class="type red">BAKER NEVER SAID HELLO. BARTOLOZZI SAID HELLO, TWICE. BARTOLOZZI DID NOT BOARD POD 2.</p>
  <div class="deaths">
    <p class="red big">DEATHS ON RECORD: 3</p>
    <div class="tl">
      <div><span class="dot"></span><b>1980</b><i>SATURN</i><i class="dim">AGE 26</i></div>
      <div><span class="dot"></span><b>2011</b><i>JUPITER</i><i class="dim">AGE 26</i></div>
      <div><span class="dot"></span><b>2018</b><i>KREEK-1</i><i class="dim">AGE 26</i></div>
    </div>
  </div>
  <div class="kv">
    <b>ATTACHED</b><i>DIRECTOR'S MEMO (ENCIPHERED)</i>
    <b>METHOD</b><i>REPEATING KEY</i>
    <b>KEY</b><i class="amb">WHAT SEAT FOUR WAS</i>
  </div>
  <pre class="cipher">{vigenere(MEMO, "HOLLOW")}</pre>
  <form class="gate" data-for="4" autocomplete="off">
    <label for="a4">WHERE DID IT RIDE HOME?</label>
    <div class="row"><input id="a4" spellcheck="false" autocapitalize="characters"><button>SUBMIT</button></div>
    <p class="err" aria-live="polite"></p>
  </form>
</section>"""

# ---------------------------------------------------------------- stage 5
NEXT = "NEXT FILE: 80-1003-SX"
S5 = f"""
<section class="stage" data-n="5">
  <div class="crumb">FILE 11-0829-JX <span>//</span> 06 / ENTITY</div>
  <p class="type red">YOU OPENED THEM.</p>
  <div class="vent-wrap"><canvas class="vent" width="720" height="420" aria-label="Ship schematic with red contacts moving through the ventilation shafts toward a marker labelled YOU"></canvas></div>
  <div class="kv">
    <b>DESIGNATION</b><i class="red">KIES</i>
    <b>ALT. SPELLING</b><i>"KEYS"</i>
    <b>MOVEMENT</b><i>VENTILATION SHAFTS</i>
    <b>BEHAVIOUR</b><i class="red">COORDINATED / MIMICS VOICES</i>
    <b>CONTACTS</b><i class="red" data-contacts>0</i>
  </div>
  <pre class="final" data-final>YOU ARE THE FIFTH PERSON TO READ FILE 11-0829-JX.
THE OTHER FOUR ARE NOW LISTED AS CREW.

LOCAL TIME RECORDED: <span data-now></span>

WE ARE NOT ASKING YOU TO KEEP THIS QUIET.
NOBODY WILL BELIEVE YOU. THAT IS HOW IT HAS ALWAYS WORKED.

IF SOMETHING IN THE WALLS SAYS HELLO
IN A VOICE YOU KNOW,
DO NOT ANSWER.</pre>
  <p class="hello" data-hello>&nbsp;</p>
  <pre class="hex">{" ".join(f"{ord(c):02X}" for c in NEXT)}</pre>
  <div class="end">
    <p>FILE 11-0829-JX // CLOSED</p>
    <div class="kv">
      <b>AUTHENTICITY</b><i class="red">NONE (CREEPYPASTA)</i>
      <b>AUTHORS</b><i>THE INTERNET, NOV 2026</i>
    </div>
    <button class="ghost" data-purge>PURGE LOCAL SESSION</button>
  </div>
</section>"""

STAGES = [S1, S2, S3, S4, S5]
blobs = [encrypt(s, ANSWERS[i]) for i, s in enumerate(STAGES)]
checks = [check(a) for a in ANSWERS]
assert all(norm(a) == a for a in ANSWERS)

tpl = (HERE / "template.html").read_text()
html = tpl.replace("__BLOBS__", json.dumps(blobs)).replace("__CHECKS__", json.dumps(checks))
html = html.replace("__B64__", base64.b64encode(b"THERE IS NO SECTION 00. YOU ARE IN IT.").decode())
(HERE / "index.html").write_text(html)
print("wrote", HERE / "index.html", len(html), "bytes")
print("stage1 cipher:", rot(CALL, 3)[:60])
print("memo cipher:", vigenere(MEMO, "HOLLOW")[:60])
print("morse:", morse)
