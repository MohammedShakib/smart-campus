import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

const routes = JSON.parse(await readFile(new URL('../src/components/shared/bus-road-paths.json', import.meta.url)));
for (const [bus, route] of Object.entries(routes)) {
  test(`${bus}: saved road geometry is continuous without repeated edges`, () => {
    assert.ok(route.coordinates.length > 40);
    const edges = new Set();
    for (let i = 1; i < route.coordinates.length; i++) {
      const a = route.coordinates[i - 1];
      const b = route.coordinates[i];
      assert.ok([...a, ...b].every(Number.isFinite));
      const edge = [a.join(','), b.join(',')].sort().join('|');
      assert.ok(!edges.has(edge), `Repeated road edge ${edge}`);
      edges.add(edge);
      assert.ok(Math.hypot((a[0] - b[0]) * 102000, (a[1] - b[1]) * 111000) < 1000);
    }
  });
}
test('Natun Bazar ends at Madani Avenue rather than the embassy road', () => {
  const route = routes['BUS-01'];
  assert.ok(route.distanceMeters > 2500 && route.distanceMeters < 3200);
  const [lng, lat] = route.coordinates.at(-1);
  assert.ok(Math.abs(lng - 90.4236084) < 0.0001 && Math.abs(lat - 23.7976806) < 0.0001);
});
test('Route Three follows the eastern corridor without the old 13 km detours', () => {
  const route = routes['BUS-03'];
  assert.ok(route.distanceMeters > 5000 && route.distanceMeters < 8000);
  assert.ok(route.coordinates.every(([lng]) => lng >= 90.44));
  assert.ok(route.coordinates.some(([, lat]) => lat < 23.775));
});
test('Route Three continues south to Meradia before turning west', () => {
  const points = routes['BUS-03'].coordinates;
  const [lng, lat] = points.at(-1);
  assert.ok(Math.abs(lng - 90.449443) < 0.0001);
  assert.ok(Math.abs(lat - 23.7712646) < 0.0001);
  // Stay east of Avenue 12 until reaching the final southern cross street.
  const southernTurn = points.findIndex(([, y]) => y < 23.7711);
  assert.ok(southernTurn > 0);
  assert.ok(points.slice(0, southernTurn).filter(([, y]) => y < 23.777)
    .every(([x]) => x > 90.453));
});
