# PathFinder AI service

```bash
cd ai-service
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
node scripts/export_data.mjs
uvicorn app.main:app --port 8001
```
