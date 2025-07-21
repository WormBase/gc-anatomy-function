FROM python:3.9-slim

WORKDIR /usr/src/app/

RUN apt-get update && apt-get install -y git

ADD requirements.txt .
RUN pip3 install -r requirements.txt
RUN pip3 install gunicorn
RUN mkdir -p /var/log  # Ensure log directory exists

COPY src/backend src/backend


ENV DB_NAME=""
ENV DB_USER=""
ENV DB_PASSWORD=""
ENV DB_HOST=""

ENV PYTHONPATH=$PYTHONPATH:/usr/src/app/

EXPOSE ${PORT}

CMD gunicorn -b 0.0.0.0:8001 -t 1800 src.backend.api:app >> /var/log/anatomy_function_api.log 2>&1