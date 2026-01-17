/**
 * Encryption utilities using Web Crypto API (AES-GCM)
 */

export const generateSessionKey = async (): Promise<CryptoKey> => {
    return await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
};

export const exportKey = async (key: CryptoKey): Promise<string> => {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

export const importKey = async (base64Key: string): Promise<CryptoKey> => {
    const binaryKey = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    return await window.crypto.subtle.importKey(
        "raw",
        binaryKey,
        "AES-GCM",
        true,
        ["encrypt", "decrypt"]
    );
};

export const encryptMessage = async (key: CryptoKey, text: string): Promise<{ encrypted: string; iv: string }> => {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);

    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoded
    );

    return {
        encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        iv: btoa(String.fromCharCode(...iv))
    };
};

export const decryptMessage = async (key: CryptoKey, encryptedBase64: string, ivBase64: string): Promise<string> => {
    const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

    const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encrypted
    );

    return new TextDecoder().decode(decrypted);
};
