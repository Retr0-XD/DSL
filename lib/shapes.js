export function shapeMarkup(shapeName, opts) {
  // opts = { color, rotationDeg }
  // returns an SVG string for a single shape, sized to fit a 40x40 viewBox cell,
  // with `transform="rotate(${rotationDeg} 20 20)"` applied.
  const shapeMap = {
    square: '<rect x="8" y="8" width="24" height="24"/>',
    circle: '<circle cx="20" cy="20" r="12"/>',
    diamond: '<polygon points="20,4 36,20 20,36 4,20"/>',
    triangle: '<polygon points="20,6 34,32 6,32"/>',
    hexagon: '<polygon points="20,4 34,12 34,28 20,36 6,28 6,12"/>',
    arrow: '<polygon points="6,13 22,13 22,5 36,20 22,35 22,27 6,27"/>',
    'corner-bracket': '<path d="M8,8 L8,32 L14,32 L14,14 L32,14 L32,8 Z"/>',
    chevron: '<path d="M10,6 L26,20 L10,34 L16,34 L32,20 L16,6 Z"/>',
    crescent: '<path d="M26,4 A16,16 0 1 0 26,36 A12,12 0 1 1 26,4 Z"/>',
    'quarter-disc': '<path d="M8,8 L8,32 A24,24 0 0 0 32,8 Z"/>'
  };

  const markup = shapeMap[shapeName];
  if (!markup) {
    console.error(`Unknown shape: ${shapeName}`);
    // Return a visible red "?" placeholder
    return '<text x="20" y="20" font-size="20" text-anchor="middle" fill="red">?</text>';
  }

  const { color, rotationDeg = 0 } = opts;
  return `<g transform="rotate(${rotationDeg} 20 20)" fill="${color}">${markup}</g>`;
}