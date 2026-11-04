# goldcoolness1-ops.github.io

Keep each year's photos in `2025pic/` or `2026pic/` and list them with their capture dates in `gallery-data.js`. Use `YYYY-MM-DDTHH:MM:SS` for dates. The browser sorts this small local list newest-first, lazy-loads half-resolution WebP previews, and opens the original image when selected. The GitHub Actions workflow generates previews and deploys the site whenever changes are pushed to `main`; it makes no GitHub API calls in the browser or fetches image metadata.

To enable deployment, set the repository's Pages build and deployment source to **GitHub Actions** in Settings > Pages.
