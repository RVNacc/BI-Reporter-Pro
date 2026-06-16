export const defaultXAxisProps = {
  angle: -90,
  textAnchor: "end",
  height: 180,
  interval: 0,
  axisLine: true,
  tickLine: true,
  tick: { fontSize: 13, fontWeight: "bold", dy: 15, dx: -8, fill: "#475569" },
};

export const defaultYAxisProps = {
  orientation: "right" as const,
  width: 100,
  tickFormatter: (v: any) => Number(v || 0).toLocaleString(),
  tick: { fontSize: 12, fill: "#475569" },
  axisLine: false,
  tickLine: false,
};

export const hideAxisProps = {
  type: "number" as const,
  hide: true,
};

export const verticalYAxisProps = {
  type: "category" as const,
  width: 150,
  tick: { fontSize: 11, fill: "#475569" },
  orientation: "right" as const,
  axisLine: false,
  tickLine: false,
};
