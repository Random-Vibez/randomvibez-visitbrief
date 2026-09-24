# Security and privacy boundary

VisitBrief is a static, browser-local tool. Its runtime uses no API, upload, account, analytics, cookie, CDN, or third-party script. The optional `.htaccess` supplies restrictive headers when hosted on a compatible Apache server; it is not required to run locally.

Appointment notes are stored in the browser's `localStorage` under `visitbrief:v1`. Anyone with access to the same browser profile may be able to read them. Browser storage is not a secure vault, and exported JSON/printed pages are unencrypted. Clear the brief and/or browser site storage when appropriate. Do not include details you do not want stored on the device or included in an export/printout.

JSON imports accept only the documented app/version and bounded fields, at most three concern rows and five questions, and files no larger than 24 KB. The whole import is validated before storage is replaced. Free-text is rendered as text, not HTML. This is an organizing aid only, not medical advice, diagnosis, triage, treatment guidance, medication advice, or emergency assessment.

Report implementation/security issues to the project maintainer without including personal or health information in the report.
