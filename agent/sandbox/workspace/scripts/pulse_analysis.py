import json
from html import escape
from pathlib import Path

input_path = Path("input.json")
output_path = Path("pulse_analysis.json")
chart_path = Path("pulse_chart.svg")
report_path = Path("report.md")

payload = json.loads(input_path.read_text())
points = payload["points"]
title = payload["title"]
metric = payload["metric"]
first = points[0]
last = points[-1]
absolute_change = last["value"] - first["value"]
percent_change = None if first["value"] == 0 else (absolute_change / first["value"]) * 100
total = sum(point["value"] for point in points)
average = total / len(points)
min_point = min(points, key=lambda point: point["value"])
max_point = max(points, key=lambda point: point["value"])
deltas = [
    {
        "from": points[index - 1]["label"],
        "to": points[index]["label"],
        "absolute": points[index]["value"] - points[index - 1]["value"],
        "percent": None
        if points[index - 1]["value"] == 0
        else (
            (points[index]["value"] - points[index - 1]["value"])
            / points[index - 1]["value"]
        )
        * 100,
    }
    for index in range(1, len(points))
]
average_abs_delta = (
    sum(abs(delta["absolute"]) for delta in deltas) / len(deltas) if deltas else 0
)
notable_moves = [
    delta
    for delta in deltas
    if average_abs_delta > 0 and abs(delta["absolute"]) >= average_abs_delta * 1.35
]
moving_average_3 = [
    {
        "label": point["label"],
        "value": sum(item["value"] for item in points[max(0, index - 2) : index + 1])
        / len(points[max(0, index - 2) : index + 1]),
    }
    for index, point in enumerate(points)
]
direction = "up" if absolute_change > 0 else "down" if absolute_change < 0 else "flat"

width = 720
height = 320
padding = 44
values = [point["value"] for point in points]
low = min(values)
high = max(values)
span = high - low or 1
step = (width - padding * 2) / max(len(points) - 1, 1)

coords = []
for index, point in enumerate(points):
    x = padding + index * step
    y = height - padding - ((point["value"] - low) / span) * (height - padding * 2)
    coords.append((x, y, point))

polyline = " ".join(f"{x:.2f},{y:.2f}" for x, y, _ in coords)
circles = "\n".join(
    f'<circle cx="{x:.2f}" cy="{y:.2f}" r="5" fill="#00c2a8"><title>{escape(point["label"])}: {point["value"]}</title></circle>'
    for x, y, point in coords
)
labels = "\n".join(
    f'<text x="{x:.2f}" y="{height - padding + 20}" fill="#8f9f9b" font-family="monospace" font-size="10" text-anchor="middle">{escape(point["label"][-5:])}</text>'
    for x, _, point in coords
)
grid = "\n".join(
    f'<line x1="{padding}" x2="{width - padding}" y1="{padding + row * ((height - padding * 2) / 4):.2f}" y2="{padding + row * ((height - padding * 2) / 4):.2f}" stroke="#24332f" stroke-width="1"/>'
    for row in range(5)
)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">
  <rect width="{width}" height="{height}" fill="#07110f"/>
  <text x="{padding}" y="30" fill="#f5f2e8" font-family="monospace" font-size="18">{escape(title)}</text>
  {grid}
  <polyline points="{polyline}" fill="none" stroke="#00c2a8" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
  {circles}
  {labels}
  <text x="{padding}" y="{height - 12}" fill="#f2b84b" font-family="monospace" font-size="13">{escape(metric)} trend generated in Eve sandbox</text>
</svg>'''

takeaway = (
    f"{metric} moved by {absolute_change:,.0f} from {first['label']} to {last['label']}."
    if percent_change is None
    else f"{metric} changed {percent_change:+.1f}% from {first['label']} to {last['label']}."
)
report = f"""# {title}

- Metric: {metric}
- Direction: {direction}
- Total: {total:,.0f}
- Average: {average:,.1f}
- Min: {min_point['label']} ({min_point['value']:,.0f})
- Max: {max_point['label']} ({max_point['value']:,.0f})
- Takeaway: {takeaway}

Sandbox artifacts:
- input: input.json
- script: /workspace/scripts/{Path(__file__).name}
- json: pulse_analysis.json
- chart: pulse_chart.svg
"""

output = {
    "title": title,
    "metric": metric,
    "points": points,
    "first": first,
    "last": last,
    "total": total,
    "average": average,
    "min": min_point,
    "max": max_point,
    "absoluteChange": absolute_change,
    "percentChange": percent_change,
    "takeaway": takeaway,
    "diagnostics": {
        "direction": direction,
        "pointCount": len(points),
        "deltas": deltas,
        "averageAbsDelta": average_abs_delta,
        "notableMoves": notable_moves,
        "movingAverage3": moving_average_3,
    },
    "artifacts": {
        "inputPath": input_path.as_posix(),
        "scriptPath": f"/workspace/scripts/{Path(__file__).name}",
        "outputPath": output_path.as_posix(),
        "chartPath": chart_path.as_posix(),
        "reportPath": report_path.as_posix(),
    },
}

output_path.write_text(json.dumps(output, indent=2))
chart_path.write_text(svg)
report_path.write_text(report)
print(output["takeaway"])
print(f"Wrote sandbox artifacts: {output_path}, {chart_path}, {report_path}")
