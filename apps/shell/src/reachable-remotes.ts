export type Manifest = Record<string, string>;

/**
 * Loads the federation manifest and keeps only the remotes whose
 * `remoteEntry.json` answers within `timeoutMs`.
 *
 * `initFederation()` fetches every remote entry before it resolves and has no
 * timeout: a remote that hangs (instead of refusing the connection) would keep
 * the whole shell from starting. Remotes left out here end up in the shell's
 * "not reachable" fallbacks instead.
 */
export async function reachableRemotes(
  manifestUrl: string,
  timeoutMs = 3000,
): Promise<Manifest> {
  const response = await fetch(manifestUrl, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`${manifestUrl} returned ${response.status}`);
  }
  const manifest = (await response.json()) as Manifest;

  const probes = Object.entries(manifest).map(async ([name, url]) => {
    try {
      const entry = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      // Only the status matters; initFederation() loads the entry itself.
      void entry.body?.cancel();
      return entry.ok;
    } catch (error) {
      console.warn(`Remote '${name}' is not reachable (${url})`, error);
      return false;
    }
  });
  const reachable = await Promise.all(probes);

  return Object.fromEntries(
    Object.entries(manifest).filter((_, i) => reachable[i]),
  );
}
