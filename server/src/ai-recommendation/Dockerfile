FROM public.ecr.aws/docker/library/python:3.12-alpine

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py ./

ENV PORT=8001
EXPOSE 8001

CMD ["python", "app.py"]
