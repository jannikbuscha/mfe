import { reachableRemotes } from './reachable-remotes';

const manifest = {
  ok: 'http://localhost:4201/remoteEntry.json',
  missing: 'http://localhost:4202/remoteEntry.json',
  down: 'http://localhost:4203/remoteEntry.json',
  hanging: 'http://localhost:4204/remoteEntry.json',
};

/** A fetch that only settles when its AbortSignal fires. */
function hang(_: string, init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) =>
    init?.signal?.addEventListener('abort', () => reject(init.signal?.reason)),
  );
}

describe('reachableRemotes', () => {
  beforeEach(() =>
    vi.spyOn(console, 'warn').mockImplementation(() => undefined),
  );
  afterEach(() => vi.restoreAllMocks());

  it('keeps only remotes whose remoteEntry.json answers in time', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      switch (String(input)) {
        case 'federation.manifest.json':
          return Promise.resolve(Response.json(manifest));
        case manifest.ok:
          return Promise.resolve(Response.json({ name: 'ok' }));
        case manifest.missing:
          return Promise.resolve(new Response(null, { status: 404 }));
        case manifest.down:
          return Promise.reject(new TypeError('Failed to fetch'));
        default:
          return hang(String(input), init);
      }
    });

    await expect(
      reachableRemotes('federation.manifest.json', 20),
    ).resolves.toEqual({
      ok: manifest.ok,
    });
  });

  it('rejects when the manifest cannot be loaded', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('not found', { status: 404 }),
    );

    await expect(reachableRemotes('federation.manifest.json')).rejects.toThrow(
      /404/,
    );
  });
});
