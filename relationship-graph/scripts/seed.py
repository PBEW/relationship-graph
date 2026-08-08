"""Seed the database with fake people, relationships, and generated avatars.

Usage (from the backend venv):
    python scripts/seed.py                      # add 100 people / 300 relationships
    python scripts/seed.py --people 50 --relationships 150
    python scripts/seed.py --reset               # wipe existing people/relationships first

Relationship types are NOT created here - they come from the Alembic seed
migration (73707af94cf9_seed_relationship_types). Run `flask db upgrade`
first.
"""
import argparse
import io
import os
import random
import sys
from datetime import date, timedelta

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, BACKEND_DIR)

from faker import Faker  # noqa: E402
from PIL import Image, ImageDraw, ImageFont  # noqa: E402

from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402
from app.models import Avatar, Person, Relationship, RelationshipType  # noqa: E402
from app.services.person_service import AVATAR_URL_PREFIX  # noqa: E402

fake = Faker()

GENDERS = ["male", "female", "non_binary", "other", "unspecified"]
STATUS_WEIGHTS = [("active", 8), ("ended", 2)]

FONT_CANDIDATES = [
    "arial.ttf",
    "C:\\Windows\\Fonts\\arialbd.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]

AVATAR_COLORS = [
    "#F87171", "#FB923C", "#FBBF24", "#A3E635", "#34D399",
    "#22D3EE", "#60A5FA", "#818CF8", "#A78BFA", "#F472B6",
]


def _load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def generate_avatar(display_name: str) -> str:
    """Store a generated initials avatar and return the URL it's served at."""
    initials = "".join(part[0].upper() for part in display_name.split()[:2]) or "?"
    size = 128
    bg = random.choice(AVATAR_COLORS)
    img = Image.new("RGB", (size, size), color=bg)
    draw = ImageDraw.Draw(img)
    font = _load_font(size // 2)
    bbox = draw.textbbox((0, 0), initials, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size - w) / 2 - bbox[0], (size - h) / 2 - bbox[1]), initials, fill="white", font=font)

    buffer = io.BytesIO()
    img.save(buffer, "PNG")

    avatar = Avatar(mimetype="image/png", data=buffer.getvalue())
    db.session.add(avatar)
    # Needed before the id can go into the person's avatar URL.
    db.session.flush()
    return f"{AVATAR_URL_PREFIX}{avatar.id}"


def random_status() -> str:
    values, weights = zip(*STATUS_WEIGHTS)
    return random.choices(values, weights=weights, k=1)[0]


def make_person(generate_avatars: bool) -> Person:
    display_name = fake.name()
    return Person(
        avatar=generate_avatar(display_name) if generate_avatars else None,
        display_name=display_name,
        nickname=fake.first_name() if random.random() < 0.5 else None,
        vrchat_name=f"{fake.user_name()}_vr" if random.random() < 0.8 else None,
        discord=f"{fake.user_name()}#{random.randint(1000, 9999)}" if random.random() < 0.8 else None,
        steam=fake.user_name() if random.random() < 0.4 else None,
        twitter=f"@{fake.user_name()}" if random.random() < 0.3 else None,
        country=fake.country() if random.random() < 0.7 else None,
        gender=random.choice(GENDERS) if random.random() < 0.85 else None,
        birthday=fake.date_of_birth(minimum_age=16, maximum_age=45) if random.random() < 0.6 else None,
        bio=fake.paragraph(nb_sentences=2) if random.random() < 0.5 else None,
    )


def make_relationship(person_a: Person, person_b: Person, relationship_type: RelationshipType) -> Relationship:
    status = random_status()
    start = fake.date_between(start_date="-5y", end_date="today")
    end = None
    if status == "ended":
        end = start + timedelta(days=random.randint(30, 900))
        if end > date.today():
            end = date.today()
    return Relationship(
        person_a_id=person_a.id,
        person_b_id=person_b.id,
        relationship_type_id=relationship_type.id,
        status=status,
        start_date=start,
        end_date=end,
        note=fake.sentence() if random.random() < 0.3 else None,
    )


def run(num_people: int, num_relationships: int, reset: bool, generate_avatars: bool) -> None:
    app = create_app()
    with app.app_context():
        types = RelationshipType.query.all()
        if not types:
            print("No relationship types found. Run `flask db upgrade` first.")
            sys.exit(1)

        if reset:
            print("Resetting: deleting all relationships and people...")
            Relationship.query.delete()
            Person.query.delete()
            Avatar.query.delete()
            db.session.commit()

        print(f"Creating {num_people} people...")
        people = [make_person(generate_avatars) for _ in range(num_people)]
        db.session.add_all(people)
        db.session.flush()

        if len(people) < 2:
            print("Need at least 2 people to create relationships.")
            db.session.commit()
            return

        print(f"Creating {num_relationships} relationships...")
        seen_pairs = set()
        relationships = []
        attempts = 0
        while len(relationships) < num_relationships and attempts < num_relationships * 20:
            attempts += 1
            a, b = random.sample(people, 2)
            pair_key = tuple(sorted((str(a.id), str(b.id))))
            rel_type = random.choice(types)
            key = (pair_key, rel_type.id)
            if key in seen_pairs:
                continue
            seen_pairs.add(key)
            relationships.append(make_relationship(a, b, rel_type))

        db.session.add_all(relationships)
        db.session.commit()

        print(f"Done: {len(people)} people, {len(relationships)} relationships.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--people", type=int, default=100)
    parser.add_argument("--relationships", type=int, default=300)
    parser.add_argument("--reset", action="store_true", help="Delete existing people/relationships first")
    parser.add_argument("--no-avatars", action="store_true", help="Skip generating avatar images")
    args = parser.parse_args()

    run(args.people, args.relationships, args.reset, not args.no_avatars)
