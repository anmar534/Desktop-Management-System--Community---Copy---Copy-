from pathlib import Path

path = Path(r"c:\Users\ammn\Desktop\MBM_app\Final_5Sep\Desktop Management System (Community) (Copy) (Copy)\src\presentation\pages\Tenders\components\TenderDetails.tsx")
data = path.read_bytes()
print("leading bytes:", data[:16])

text = data.decode("utf-16-le")
start = text.index("summary.push('") + len("summary.push('")
end = text.index("')", start)
segment = text[start:end]
print("segment sample:", segment[:40])
print([hex(ord(ch)) for ch in segment[:10]])
