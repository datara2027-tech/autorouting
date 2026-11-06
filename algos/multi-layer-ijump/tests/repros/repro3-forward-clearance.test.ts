import { expect, test } from "bun:test"
import { MultilayerIjump } from "../../MultilayerIjump"
import type { Obstacle } from "autorouting-dataset/lib/types"

const obstacle = (x: number, y: number, width: number, height: number): Obstacle => ({
  type: "rect",
  layers: ["top", "bottom"],
  center: { x, y },
  width,
  height,
  connectedTo: [],
})

test("continue forward through a clear gap after rounding an obstacle", () => {
  const router = new MultilayerIjump({
    input: {
      layerCount: 2,
      minTraceWidth: 0.1,
      bounds: { minX: -12, maxX: 12, minY: -12, maxY: 12 },
      obstacles: [
        obstacle(4, 4, 3, 4),
        obstacle(0, 0, 1, 4),
        obstacle(1, -4, 3, 4),
        obstacle(2, -1, 2, 2),
      ],
      connections: [{
        name: "trace",
        pointsToConnect: [
          { x: -9, y: 0, layer: "top" },
          { x: 9, y: 2, layer: "top" },
        ],
      }],
    },
  })
  const traces = router.solveAndMapToTraces()
  expect(traces).toHaveLength(1)
  const route = traces[0].route
  expect(route.map(({ x, y }) => [x, y])).toMatchSnapshot()
  expect([route.at(-1)?.x, route.at(-1)?.y]).toEqual([9, 2])
  // The clear gap crosses x=4 below the top obstacle. The old route
  // continued up to y=7, adding 6 mm to this 24 mm connection.
  const length = route.slice(1).reduce((sum, point, i) =>
    sum + Math.abs(point.x - route[i].x) + Math.abs(point.y - route[i].y), 0)
  expect(length).toBeLessThanOrEqual(24)
})

