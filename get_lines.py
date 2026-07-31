with open('/tmp/CostAllocationView.tsx', 'r') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "return (" in line and "<div key={cc.id}" in line:
        print(f"START {i}")
    if "</div>" in line and "    </div>" in line and "  </div>" in line:
        print(f"END {i}")
