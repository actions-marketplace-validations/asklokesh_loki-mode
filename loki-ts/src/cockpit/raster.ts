// SVG -> PNG rasterize via @resvg/resvg-js, best-effort only.
//
// resvg is NOT a hard dependency: if it is not installed we return null and the
// caller falls back to the browser dashboard. This keeps `loki cockpit` from
// requiring a native build step at install time.

export interface RasterResult {
  png: Uint8Array | null;
  available: boolean;
  reason?: string;
}

let cachedResvg: unknown | undefined; // undefined = not looked up yet

function loadResvg(): unknown | null {
  if (cachedResvg !== undefined) return cachedResvg as unknown | null;
  try {
    // require.resolve throws if not installed; only then do we require it.
    const req = (globalThis as { require?: NodeRequire }).require ?? require;
    req.resolve("@resvg/resvg-js");
    cachedResvg = req("@resvg/resvg-js");
  } catch {
    cachedResvg = null;
  }
  return cachedResvg as unknown | null;
}

export function rasterAvailable(): boolean {
  return loadResvg() !== null;
}

export function rasterize(svg: string, width = 900): RasterResult {
  const mod = loadResvg() as
    | { Resvg?: new (svg: string, opts?: unknown) => { render(): { asPng(): Uint8Array } } }
    | null;
  if (!mod || typeof mod.Resvg !== "function") {
    return { png: null, available: false, reason: "raster unavailable (@resvg/resvg-js not installed)" };
  }
  try {
    const resvg = new mod.Resvg(svg, { fitTo: { mode: "width", value: width } });
    const png = resvg.render().asPng();
    return { png: Uint8Array.from(png), available: true };
  } catch (e) {
    return { png: null, available: false, reason: `raster failed: ${(e as Error).message}` };
  }
}
