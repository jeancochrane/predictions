import random

from colorfield.fields import ColorField
from django.db import models
from django.contrib.auth import get_user_model


def random_x():
    """Return a random x-coordinate for use in default field values."""
    return random.randint(0, 1200)


def random_y():
    """Return a random y-coordinate for use in default field values."""
    return random.randint(0, 500)


def random_color():
    """Return a random hex-encoded color for use in default field values."""
    colors = ['#ebe9a5', '#ccf6c8', '#ffd57e', '#f9c0c0', '#51adcf']
    randint = random.randint(0, len(colors)-1)
    return colors[randint]


class Prediction(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    text = models.TextField()
    created = models.DateTimeField(auto_now_add=True)
    position_x = models.IntegerField(default=random_x)
    position_y = models.IntegerField(default=random_y)

    def as_dict(self):
        """Return a dictionary representation of the prediction."""
        return {
            'id': self.id,
            'userId': self.user.id,
            'username': self.user.username,
            'text': self.text,
            'created': self.created,
            'positionX': self.position_x,
            'positionY': self.position_y
        }


class Profile(models.Model):
    user = models.OneToOneField(get_user_model(), on_delete=models.CASCADE)
    color = ColorField(default=random_color)

    def __str__(self):
        return self.user.username


def user_can_manage_predictions(user):
    """Check if a User can manage the Prediction model."""
    return user.has_perms([
        f'predictions.{verb}_prediction' for verb in
        ['add', 'change', 'delete', 'view']
    ])


def get_user_info():
    """Return a map of information."""
    user_info = {}
    User = get_user_model()
    for user in User.objects.all():
        user_info[user.id] = {
            'username': user.username,
            'color': user.profile.color
        }
    return user_info
