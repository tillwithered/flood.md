import { createHash, createPublicKey, verify } from "node:crypto";
import { readFile } from "node:fs/promises";

const [artifactPath, signaturePath, configPath = "src-tauri/tauri.conf.json"] = process.argv.slice(2);
if (!artifactPath || !signaturePath) {
  throw new Error("Usage: node scripts/verify-updater-signature.mjs <artifact> <signature> [tauri.conf.json]");
}

const [artifact, signatureEnvelope, configText] = await Promise.all([
  readFile(artifactPath),
  readFile(signaturePath, "utf8"),
  readFile(configPath, "utf8")
]);
const config = JSON.parse(configText);
const publicKeyFile = Buffer.from(config.plugins.updater.pubkey, "base64").toString("utf8");
const signatureText = signatureEnvelope.startsWith("untrusted comment:")
  ? signatureEnvelope
  : Buffer.from(signatureEnvelope.trim(), "base64").toString("utf8");
const publicKeyLine = publicKeyFile.split(/\r?\n/).find((line) => line && !line.startsWith("untrusted comment:"));
const signatureLine = signatureText.split(/\r?\n/).find((line) => line && !line.startsWith("untrusted comment:") && !line.startsWith("trusted comment:"));
if (!publicKeyLine || !signatureLine) throw new Error("Updater key or signature has invalid minisign framing");

const encodedKey = Buffer.from(publicKeyLine, "base64");
const encodedSignature = Buffer.from(signatureLine, "base64");
if (encodedKey.length !== 42 || encodedSignature.length !== 74) throw new Error("Updater key or signature has an invalid length");
if (!encodedKey.subarray(2, 10).equals(encodedSignature.subarray(2, 10))) throw new Error("Updater signature was produced by a different key");

const algorithm = encodedSignature.subarray(0, 2).toString("ascii");
if (algorithm !== "Ed" && algorithm !== "ED") throw new Error(`Unsupported minisign algorithm: ${algorithm}`);
const message = algorithm === "ED" ? createHash("blake2b512").update(artifact).digest() : artifact;
const spki = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), encodedKey.subarray(10)]);
const publicKey = createPublicKey({ key: spki, format: "der", type: "spki" });
const signature = encodedSignature.subarray(10);
if (!verify(null, message, publicKey, signature)) throw new Error("Updater artifact signature is invalid");

const tampered = Buffer.from(artifact);
tampered[Math.max(0, tampered.length - 1)] ^= 1;
const tamperedMessage = algorithm === "ED" ? createHash("blake2b512").update(tampered).digest() : tampered;
if (verify(null, tamperedMessage, publicKey, signature)) throw new Error("Tampered updater artifact unexpectedly passed signature verification");

console.log("Updater signature verified; a one-byte mutation was rejected.");
