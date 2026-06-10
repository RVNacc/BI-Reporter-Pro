export const defaultXAxisProps = {
  angle: -90,
  textAnchor: "end",
  height: 160,
  interval: 0,
  axisLine: false,
  tickLine: false,
  tick: { fontSize: 12, fontWeight: "bold", dy: 5, dx: -5, fill: "#475569" },
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
