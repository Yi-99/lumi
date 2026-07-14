// vault.js — encrypted API-key storage, shared by options page and service worker.
//
// Threat model & guarantees:
//   In flight — every provider request is HTTPS (TLS); keys never leave the
//     browser except inside TLS to that provider. Intra-extension messages
//     (content script ↔ service worker) never touch the network.
//   At rest — keys are sealed with AES-GCM-256 before touching disk. The
//     master key is a NON-EXTRACTABLE WebCrypto CryptoKey persisted in
//     IndexedDB: its raw bytes are never exposed to JavaScript, so the
//     ciphertext in chrome.storage.local cannot be decrypted by reading
//     storage or the synced profile alone.
//   Limits — code running inside this extension can still ask WebCrypto to
//     decrypt, and malware running as your OS user can defeat any
//     browser-level protection. Defense-in-depth, not an HSM.

// Firefox: promise-style chrome.* lives on browser.*; alias it over.
if (typeof browser !== "undefined") globalThis.chrome = browser;

const VAULT_DB = "llm-lookup-vault";
const VAULT_STORE = "keys";
const MASTER_ID = "master-v1";
const SECRET_NAMES = ["anthropicKey", "openaiKey", "geminiKey"];

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(VAULT_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(VAULT_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(db, key) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(VAULT_STORE).objectStore(VAULT_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbAdd(db, key, value) {
  // add() (not put) so a concurrent context generating its own master key
  // loses the race loudly instead of silently overwriting ours.
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VAULT_STORE, "readwrite");
    tx.objectStore(VAULT_STORE).add(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function getMasterKey() {
  const db = await idbOpen();
  const existing = await idbGet(db, MASTER_ID);
  if (existing) return existing;
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false, // non-extractable: raw key bytes never readable from JS
    ["encrypt", "decrypt"]
  );
  try {
    await idbAdd(db, MASTER_ID, key);
    return key;
  } catch (_) {
    return idbGet(db, MASTER_ID); // another context won the race — use theirs
  }
}

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function sealSecret(plaintext) {
  const key = await getMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // fresh IV per seal
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return { iv: b64(iv), ct: b64(ct) };
}

async function openSecret(sealed) {
  const key = await getMasterKey();
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: unb64(sealed.iv) },
    key,
    unb64(sealed.ct)
  );
  return new TextDecoder().decode(pt);
}

// Storage layout: chrome.storage.local { vault: { anthropicKey: {iv, ct}, … } }

async function vaultSet(name, plaintext) {
  const { vault = {} } = await chrome.storage.local.get("vault");
  if (plaintext) vault[name] = await sealSecret(plaintext);
  else delete vault[name];
  await chrome.storage.local.set({ vault });
}

async function vaultGetAll() {
  const { vault = {} } = await chrome.storage.local.get("vault");
  const out = {};
  for (const [name, sealed] of Object.entries(vault)) {
    try {
      out[name] = await openSecret(sealed);
    } catch (_) {
      /* corrupted entry — treat as absent */
    }
  }
  return out;
}

// Names of providers that have a sealed key (no decryption needed).
async function vaultStatus() {
  const { vault = {} } = await chrome.storage.local.get("vault");
  return Object.keys(vault);
}

// One-time migration: seal legacy plaintext keys from chrome.storage.sync,
// then scrub them from the synced (plaintext) area.
async function migrateLegacyKeys() {
  const legacy = await chrome.storage.sync.get(SECRET_NAMES);
  const found = SECRET_NAMES.filter((k) => legacy[k]);
  if (found.length === 0) return false;
  for (const k of found) await vaultSet(k, legacy[k]);
  await chrome.storage.sync.remove(SECRET_NAMES);
  return true;
}
