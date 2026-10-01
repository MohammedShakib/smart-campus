import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Control points are road locations, not the rendered line. Save full routing
// geometry so a public routing service cannot change the route on page reload.
const controls = {
  'BUS-01': [[90.4492, 23.7979], [90.4236084, 23.7976806]],
  // Continue south on Avenue 12 before turning west toward Meradia.
  // A control on the northbound carriageway at 23.7742 caused a U-turn.
  'BUS-03': [[90.4492, 23.7979], [90.45548, 23.79607], [90.45833, 23.7902], [90.45828, 23.77915], [90.4533148, 23.771477], [90.449443, 23.7712646]]
};

const destination = new URL('../src/components/shared/bus-road-paths.json', import.meta.url);
const selectedBus = process.argv[2];
if (selectedBus && !controls[selectedBus]) throw new Error(`Unknown route: ${selectedBus}`);
const result = selectedBus ? JSON.parse(await readFile(destination, 'utf8')) : {};
for (const [bus, points] of Object.entries(controls)) {
  if (selectedBus && bus !== selectedBus) continue;
  const radiuses = points.map(() => 35).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${points.map(p => p.join(',')).join(';')}?overview=full&geometries=geojson&steps=false&radiuses=${radiuses}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${bus}: HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== 'Ok') throw new Error(`${bus}: ${data.code}`);
  const route = data.routes[0];
  result[bus] = {
    source: 'OSRM driving / OpenStreetMap contributors',
    capturedAt: new Date().toISOString(),
    referenceMatch: bus === 'BUS-03' ? 'Southern approach corrected from Meradia reference screenshots; exact Google route not verified' : 'Existing corridor',
    controlPoints: points,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    coordinates: route.geometry.coordinates
  };
  console.log(`${bus}: ${route.distance} m, ${route.geometry.coordinates.length} road vertices`);
}
const directory = new URL('../src/components/shared/', import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(new URL('bus-road-paths.json', directory), JSON.stringify(result, null, 2) + '\n');
