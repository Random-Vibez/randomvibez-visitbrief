# VisitBrief

VisitBrief is a narrow, browser-local appointment preparation tool. It turns an appointment date/type, one main priority, up to three concerns with timing and impact, changes or observations, up to five questions, and optional clinician context into a concise preview that can be printed or saved as JSON.

## Use

Open `index.html` in a current browser, or serve this directory locally:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. The page autosaves in this browser's local storage. Use **Print brief**, **Export JSON**, **Import JSON**, or **Clear this brief** in the preview panel. Imports are schema-checked and size-bounded; an invalid import does not replace the current brief. The app does not require a server at runtime and makes no API/network calls.

## Privacy and limits

No cookies, tracking, accounts, analytics, remote assets, or uploads. Notes stay in this browser unless you export or print them. Browser data may be lost when site storage is cleared, and exports/printouts are unencrypted. Do not use a shared device for information you do not want others to see. VisitBrief organizes a conversation; it does not diagnose, triage, recommend treatment or medication, or make emergency assessments. It is not a substitute for professional care.

## Checks

```sh
node --check app.js
node tests/test_runtime.js
python3 -m pytest -q tests/test_static.py
```

Preview asset: `preview.svg` (illustrative artwork, not an application screenshot).
