"""Vẽ biểu đồ từ file results.jtl của mỗi kịch bản -> images/<kịch bản>-charts.png
Dùng: python3 scripts/plot_results.py"""
import csv
from collections import defaultdict
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent.parent
TITLES = {"load": "Load test (100 users)", "stress": "Stress test (500 users)",
          "spike": "Spike test (1000 users, ramp-up 2s)",
          "breakpoint": "Breakpoint test (4000 users, không think time)"}

for name, title in TITLES.items():
    jtl = ROOT / "results" / name / "results.jtl"
    if not jtl.exists():
        continue
    rows = list(csv.DictReader(open(jtl, encoding="utf-8")))
    t0 = min(int(r["timeStamp"]) for r in rows)
    per_sec = defaultdict(lambda: {"n": 0, "err": 0, "rt": [], "threads": 0})
    for r in rows:
        s = (int(r["timeStamp"]) - t0) // 1000
        b = per_sec[s]
        b["n"] += 1
        b["err"] += r["success"] == "false"
        b["rt"].append(int(r["elapsed"]))
        b["threads"] = max(b["threads"], int(r["allThreads"]))
    xs = sorted(per_sec)
    avg = [sum(per_sec[x]["rt"]) / len(per_sec[x]["rt"]) for x in xs]
    p95 = [sorted(per_sec[x]["rt"])[int(0.95 * (len(per_sec[x]["rt"]) - 1))] for x in xs]

    fig, axes = plt.subplots(3, 1, figsize=(11, 9), sharex=True)
    fig.suptitle(f"{title} — {len(rows)} requests", fontsize=14, weight="bold")
    axes[0].plot(xs, [per_sec[x]["threads"] for x in xs], color="#6b5bd6")
    axes[0].set_ylabel("Active threads")
    axes[1].plot(xs, avg, label="Trung bình", color="#2a7ab0")
    axes[1].plot(xs, p95, label="P95", color="#e08a1e")
    axes[1].set_ylabel("Response time (ms)")
    axes[1].legend()
    axes[2].bar(xs, [per_sec[x]["n"] - per_sec[x]["err"] for x in xs], color="#4caf50", label="Thành công")
    axes[2].bar(xs, [per_sec[x]["err"] for x in xs],
                bottom=[per_sec[x]["n"] - per_sec[x]["err"] for x in xs], color="#e53935", label="Lỗi")
    axes[2].set_ylabel("Requests / giây")
    axes[2].set_xlabel("Thời gian (giây)")
    axes[2].legend()
    for ax in axes:
        ax.grid(alpha=0.3)
    fig.tight_layout()
    out = ROOT / "images" / f"{name}-charts.png"
    fig.savefig(out, dpi=110)
    print("Đã lưu", out.relative_to(ROOT))
