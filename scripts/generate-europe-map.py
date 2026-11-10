#!/usr/bin/env python3
"""Project Natural Earth 1:50m public-domain country boundaries for the comparison map."""
import argparse
import hashlib
import json
import math
import urllib.request
from pathlib import Path

SOURCE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'
BOUNDS = (-13, 35, 24, 56)
WIDTH = 760


def project(lon, lat):
    west, south, east, north = BOUNDS
    scale = WIDTH / math.radians(east - west)
    mercator = lambda angle: math.log(math.tan(math.pi / 4 + math.radians(angle) / 2))
    return [round(math.radians(lon - west) * scale, 2), round((mercator(north) - mercator(lat)) * scale, 2)]


def visible(ring):
    west, south, east, north = BOUNDS
    xs, ys = zip(*ring)
    return max(xs) >= west and min(xs) <= east and max(ys) >= south and min(ys) <= north


def clipped(ring):
    # Unwrap date-line crossings before clipping; otherwise a remote polygon can span Europe.
    points = []
    for lon, lat in ring:
        if points:
            while lon - points[-1][0] > 180:
                lon -= 360
            while lon - points[-1][0] < -180:
                lon += 360
        points.append([lon, lat])
    if not visible(points):
        return []
    west, south, east, north = BOUNDS
    for axis, limit, above in [(0, west, True), (0, east, False), (1, south, True), (1, north, False)]:
        result = []
        for previous, current in zip(points[-1:] + points[:-1], points):
            inside = lambda point: point[axis] >= limit if above else point[axis] <= limit
            if inside(previous) != inside(current):
                fraction = (limit - previous[axis]) / (current[axis] - previous[axis])
                result.append([previous[i] + fraction * (current[i] - previous[i]) for i in [0, 1]])
            if inside(current):
                result.append(current)
        points = result
        if not points:
            return []
    return points


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=Path, help='Existing Natural Earth GeoJSON; otherwise download the published source.')
    args = parser.parse_args()
    raw = args.input.read_bytes() if args.input else urllib.request.urlopen(SOURCE, timeout=45).read()
    data = json.loads(raw)
    features = []
    for feature in data['features']:
        geometry = feature['geometry']
        polygons = geometry['coordinates'] if geometry['type'] == 'MultiPolygon' else [geometry['coordinates']]
        rings = [result for polygon in polygons for ring in polygon if (result := clipped(ring)) and len(result) >= 3]
        if not rings:
            continue
        paths = []
        for ring in rings:
            points = [project(lon, lat) for lon, lat in ring]
            paths.append('M' + 'L'.join(f'{x},{y}' for x, y in points) + 'Z')
        props = feature['properties']
        features.append({'code': props.get('ISO_A2_EH', props['ISO_A2']), 'name': props['ADMIN'], 'path': ''.join(paths)})
    label_points = {
        'BE': {'anchor': [4.6, 50.8], 'label': [-2.9, 51.6]},
        'FR': {'anchor': [2.2, 46.3], 'label': [1.8, 46.3]},
        'NL': {'anchor': [5.2, 52.4], 'label': [2.5, 55]},
        'DE': {'anchor': [10.5, 51.1], 'label': [12.3, 51.1]},
        'ES': {'anchor': [-3.8, 40.3], 'label': [-3.8, 40.3]},
    }
    result = {
        'source': SOURCE, 'sourceSha256': hashlib.sha256(raw).hexdigest(),
        'attribution': 'Natural Earth · 1:50m · public domain',
        'termsUrl': 'https://www.naturalearthdata.com/about/terms-of-use/',
        'projection': 'Mercator, EPSG:3857-style spherical projection; European viewport only',
        'bounds': BOUNDS, 'width': WIDTH, 'height': project(BOUNDS[0], BOUNDS[1])[1],
        'features': features,
        'labels': {code: {key: project(*point) for key, point in points.items()} for code, points in label_points.items()},
    }
    target = Path(__file__).resolve().parents[1] / 'src/data/reference/europe-country-map.json'
    target.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'Wrote {len(features)} geographic features ({target.stat().st_size} bytes).')


if __name__ == '__main__':
    main()
