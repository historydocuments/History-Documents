export const SITE_NAME_KEY = "arcade-site-name";
export const SITE_ICON_KEY = "arcade-site-icon";

const DEFAULT_NAME = "Arcade Hub";
const DEFAULT_ICON = "🕹️";
const ALLOWED_ICONS = new Set(["🎮", "🕹️", "⭐", "🚀", "🎯", "🧩"]);

export function isValidSiteIconUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

export function readSiteIdentity() {
    try {
        const savedName = localStorage.getItem(SITE_NAME_KEY);
        const savedIcon = localStorage.getItem(SITE_ICON_KEY);
        return {
            name: savedName && savedName.trim() ? savedName.trim().slice(0, 40) : DEFAULT_NAME,
            icon: isValidSiteIconUrl(savedIcon) || ALLOWED_ICONS.has(savedIcon) ? savedIcon : DEFAULT_ICON
        };
    } catch (error) {
        console.warn("Site branding preferences could not be read", error);
        return { name: DEFAULT_NAME, icon: DEFAULT_ICON };
    }
}

export function applySiteIdentity() {
    const { name, icon } = readSiteIdentity();
    const title = document.querySelector("title");
    if (title) title.textContent = name;

    let favicon = document.querySelector("link[data-site-favicon]");
    if (!favicon) {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        favicon.dataset.siteFavicon = "true";
        document.head.append(favicon);
    }
    if (isValidSiteIconUrl(icon)) {
        favicon.href = icon;
        return;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#151d18"/><text x="32" y="45" text-anchor="middle" font-size="42">${icon}</text></svg>`;
    favicon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

window.addEventListener("storage", (event) => {
    if (event.key === SITE_NAME_KEY || event.key === SITE_ICON_KEY) applySiteIdentity();
});
window.addEventListener("arcadeidentitychange", applySiteIdentity);

applySiteIdentity();
