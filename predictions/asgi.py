"""
ASGI config for example_app project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/howto/deployment/asgi/
"""

import os

import django

# Set up Django before defining the application, because otherwise the
# channels.AuthMiddlewareStack import throws an "apps not loaded" error
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'predictions.settings')
django.setup()

from predictions.routing import application
