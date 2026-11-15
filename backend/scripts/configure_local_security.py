"""Generate the local Fernet key without printing or replacing an existing key."""
from pathlib import Path
import re
from cryptography.fernet import Fernet

path = Path(__file__).resolve().parents[1] / ".env"
source = path.read_text(encoding="utf-8") if path.exists() else ""
match = re.search(r'^TWO_FACTOR_ENCRYPTION_KEY\s*=\s*(.*)$', source, re.MULTILINE)
if match and match.group(1).strip().strip('"\''):
    print("Chave 2FA existente preservada.")
else:
    line = 'TWO_FACTOR_ENCRYPTION_KEY="' + Fernet.generate_key().decode() + '"'
    source = source[:match.start()] + line + source[match.end():] if match else source.rstrip() + "\n" + line + "\n"
    path.write_text(source, encoding="utf-8")
    print("Chave 2FA gerada no .env local; preserve esse arquivo e mantenha-o fora do Git.")
