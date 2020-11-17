import random

from django.db import models
from django.contrib.auth import get_user_model


def random_x():
    """Return a random x-coordinate for use in default field values."""
    return random.randint(0, 1200)


def random_y():
    """Return a random y-coordinate for use in default field values."""
    return random.randint(0, 500)


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
            'username': self.user.username,
            'text': self.text,
            'created': self.created,
            'positionX': self.position_x,
            'positionY': self.position_y
        }


def user_can_manage_predictions(user):
    """Check if a User can manage the Prediction model."""
    return user.has_perms([
        f'predictions.{verb}_prediction' for verb in
        ['add', 'change', 'delete', 'view']
    ])
