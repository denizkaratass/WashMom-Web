# Vercel dışında Docker ile çalıştırmak için (canlı backend Vercel'de, bkz. vercel.json). 7860 portu ve 1000 uid'li kullanıcı Docker tabanlı ücretsiz sunucularla (ör. Hugging Face Spaces) uyumludur.
FROM python:3.12-slim

RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH" \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

COPY --chown=user . .

EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
