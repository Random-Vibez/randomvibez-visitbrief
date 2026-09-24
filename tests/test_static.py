import re
from pathlib import Path

ROOT = Path(__file__).parents[1]


def test_static_privacy_and_accessibility_contract():
    html = (ROOT / "index.html").read_text()
    js = (ROOT / "app.js").read_text()
    css = (ROOT / "styles.css").read_text()
    policy = (ROOT / ".htaccess").read_text()
    assert 'id="briefForm"' in html
    assert all(name in html for name in ["appointmentDate", "appointmentType", "topConcern", "observations", "clinicianContext"])
    assert 'data-index="2"' in html and 'data-question="4"' in html
    assert 'no cookies' in html.lower() and 'no tracking' in html.lower()
    assert 'role="status"' in html and 'class="skip-link"' in html
    assert "localStorage" in js and "textContent" in js and "replaceChildren" in js
    assert "fetch(" not in js and "XMLHttpRequest" not in js and "innerHTML" not in js and "document.write" not in js
    assert "connect-src 'none'" in policy and "frame-ancestors 'none'" in policy
    assert "prefers-reduced-motion" in css and "@media print" in css
    assert not re.search(r"<(?:script|link)[^>]+(?:https?:)?//", html, re.I)
    for name in ["index.html", "app.js", "styles.css", ".htaccess", "README.md", "LICENSE", "SECURITY.md", "preview.svg", "tests/test_runtime.js"]:
        assert (ROOT / name).is_file(), name
    assert not (ROOT / "cookie-banner.js").exists()
    assert not (ROOT / "cookie-banner.css").exists()


def test_bounds_and_atomic_import_implementation():
    js = (ROOT / "app.js").read_text()
    assert "MAX_STATE = 12000" in js and "MAX_FILE = 24000" in js
    assert "value.concerns.length > 3" in js and "value.questions.length > 5" in js
    assert "readCandidate(String(reader.result))" in js
    assert js.index("localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate))") < js.index("state = candidate; fillForm(state)")
    assert "Your current brief is unchanged" in js


if __name__ == "__main__":
    test_static_privacy_and_accessibility_contract()
    test_bounds_and_atomic_import_implementation()
    print("VisitBrief static checks: PASS")
