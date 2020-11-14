FROM python:3.8

# Add the NodeSource PPA
# (see: https://github.com/nodesource/distributions/blob/master/README.md)
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -

RUN apt-get install -y --no-install-recommends postgresql-client nodejs

# Inside the container, create an app directory and switch into it
RUN mkdir /app
WORKDIR /app

# Copy the requirements file into the app directory, and install them
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install Node requirements
COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json
RUN npm install

# Copy the contents of the current host directory (i.e., our app code) into
# the container.
COPY . /app

# Add a bogus env var for the Django secret key and debug in order to allow us to run
# the 'collectstatic' and 'compress' management commands
ENV DJANGO_SECRET_KEY 'foobar'
ENV DJANGO_DEBUG 'False'

# Build static files into the container
RUN python manage.py collectstatic --noinput
RUN python manage.py compress
