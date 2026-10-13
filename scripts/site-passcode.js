export const SITE_PASSCODE_ITERATIONS = 210000;
export const SITE_PASSCODE_STORAGE_KEY = "arcade-site-passcode-hash";
const LEGACY_SESSION_KEY = SITE_PASSCODE_STORAGE_KEY;

export function readSavedSitePasscodeHash() {
    try {
        const savedHash = localStorage.getItem(SITE_PASSCODE_STORAGE_KEY);
        if (savedHash) return savedHash;
    } catch (error) {
        console.warn("Saved site passcode could not be read", error);
        return null;
    }

    try {
        const legacyHash = sessionStorage.getItem(LEGACY_SESSION_KEY);
        if (!legacyHash) return null;
        localStorage.setItem(SITE_PASSCODE_STORAGE_KEY, legacyHash);
        sessionStorage.removeItem(LEGACY_SESSION_KEY);
        return legacyHash;
    } catch (error) {
        console.warn("The previous session passcode could not be migrated", error);
        return null;
    }
}

export function saveSitePasscodeHash(hash) {
    try {
        localStorage.setItem(SITE_PASSCODE_STORAGE_KEY, hash);
        return true;
    } catch (error) {
        console.warn("Site passcode could not be saved in this browser", error);
        return false;
    }
}

function bytesToHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex) {
    if (typeof hex !== "string" || !/^(?:[0-9a-f]{2})+$/i.test(hex)) {
        throw new Error("The saved passcode setting is invalid.");
    }
    return Uint8Array.from(hex.match(/.{2}/g), (byte) => parseInt(byte, 16));
}

export function isValidSitePasscode(record) {
    return Boolean(record)
        && typeof record.salt === "string"
        && /^[0-9a-f]{32}$/i.test(record.salt)
        && typeof record.hash === "string"
        && /^[0-9a-f]{64}$/i.test(record.hash)
        && record.iterations === SITE_PASSCODE_ITERATIONS;
}

export async function hashSitePasscode(passcode, salt) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error("Secure passcode checks are unavailable in this browser. Use a modern browser over HTTPS.");
    }
    const key = await window.crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(passcode),
        "PBKDF2",
        false,
        ["deriveBits"]
    );
    const bits = await window.crypto.subtle.deriveBits({
        name: "PBKDF2",
        hash: "SHA-256",
        salt,
        iterations: SITE_PASSCODE_ITERATIONS
    }, key, 256);
    return bytesToHex(new Uint8Array(bits));
}

export async function createSitePasscodeRecord(passcode) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    return {
        salt: bytesToHex(salt),
        hash: await hashSitePasscode(passcode, salt),
        iterations: SITE_PASSCODE_ITERATIONS
    };
}
