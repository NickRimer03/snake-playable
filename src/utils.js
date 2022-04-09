export function getDirection(x, y, ox, oy) {
  if (y > oy) {
    return 'DOWN'
  }
  if (y < oy) {
    return 'UP'
  }
  if (x > ox) {
    return 'RIGHT'
  }

  return 'LEFT'
}

export default {
  getDirection,
}
