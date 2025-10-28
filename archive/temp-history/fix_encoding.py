from pathlib import Path

from ftfy import fix_bytes

source = Path("temp/TenderPricingProcess_base.tsx")
output = Path("temp/TenderPricingProcess_base_ftfy.tsx")

data = source.read_bytes()
fixed = fix_bytes(data)
output.write_text(fixed, encoding="utf-8")
