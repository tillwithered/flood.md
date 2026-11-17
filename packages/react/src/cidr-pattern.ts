const octet = "(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])";
const ipv4 = `(?:${octet}\\.){3}${octet}`;
const hex = "[0-9A-Fa-f]{1,4}";
const ipv4Prefix = "(?:3[0-2]|[12][0-9]|[0-9])";
const ipv6Prefix = "(?:12[0-8]|1[01][0-9]|[1-9][0-9]?|0)";

function ipv6AddressPattern() {
  const uncompressed = [`(?:${hex}:){7}${hex}`, `(?:${hex}:){6}${ipv4}`];
  // A double colon replaces at least one hextet. A dotted suffix occupies two.
  const compressed = Array.from({length:8}, (_, left) => {
    const prefix = Array<string>(left).fill(hex).join(":") + "::";
    const right = left === 7 ? "" : `(?:(?:${hex}:){0,${6 - left}}${hex})?`;
    return prefix + right;
  });
  const embedded = Array.from({length:6}, (_, left) =>
    `${Array<string>(left).fill(hex).join(":")}::(?:${hex}:){0,${5 - left}}${ipv4}`);
  return `(?:${[...uncompressed, ...compressed, ...embedded].join("|")})`;
}

const ipv4Cidr = `${ipv4}\\/${ipv4Prefix}`;
const ipv6Address = /* @__PURE__ */ ipv6AddressPattern();
const ipv6Cidr = `${ipv6Address}\\/${ipv6Prefix}`;

export function cidrPattern(family: "IPv4" | "IPv6" | undefined) {
  return family === "IPv4" ? ipv4Cidr : family === "IPv6" ? ipv6Cidr : `(?:${ipv4Cidr}|${ipv6Cidr})`;
}
