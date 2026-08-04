# Scripts

## `seed.py`

Generates fake people, relationships, and locally-generated avatar images (simple colored initials PNGs, via Pillow) using [Faker](https://faker.readthedocs.io/).

Requires the database to already have relationship types (run `flask db upgrade` first — they're seeded by the initial migration).

```bash
cd backend
./venv/Scripts/activate            # Windows; source venv/bin/activate on Unix
python ../scripts/seed.py                                  # 100 people, 300 relationships
python ../scripts/seed.py --people 30 --relationships 60    # smaller dataset
python ../scripts/seed.py --reset                           # wipe existing people/relationships first
python ../scripts/seed.py --no-avatars                      # skip avatar image generation (faster)
```

Reads the same `DATABASE_URL` / `UPLOAD_FOLDER` config as the Flask app (via `backend/.env`), so it writes to whatever database your backend is currently pointed at.
