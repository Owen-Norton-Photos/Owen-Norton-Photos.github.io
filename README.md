# goldcoolness1-ops.github.io

Keep each year's photos in `2025pic/` or `2026pic/` and list them in `gallery-data.js`. Use `YYYY-MM-DDTHH:MM:SS` for capture dates; omit `date` when the capture date is unavailable. The browser sorts dated photos newest-first and undated photos last, lazy-loads half-resolution WebP previews, and opens the original image when selected. HEIC/HEIF photos also get full-resolution JPEG copies for browsers that cannot display the originals, used in the viewer and as a fallback if a WebP preview is missing. The GitHub Actions workflow generates these images and deploys the site whenever changes are pushed to `main`; it makes no GitHub API calls in the browser or fetches image metadata.

To enable deployment, set the repository's Pages build and deployment source to **GitHub Actions** in Settings > Pages.
