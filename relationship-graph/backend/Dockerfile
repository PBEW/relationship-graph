FROM python:3.13-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# One worker: the JWT revocation list (app/services/auth_service.py) and the
# login rate limiter (app/extensions.py) both keep state in process memory, so
# extra workers would let a logged-out token keep working on another one and
# give each worker its own rate-limit budget. Move both to Redis before
# raising this.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "wsgi:app"]
