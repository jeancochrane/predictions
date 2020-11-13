from django.db import models
from django.contrib.auth import get_user_model


class Prediction(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    text = models.TextField()
    created = models.DateTimeField(auto_now_add=True)

    def as_dict(self):
        """Return a dictionary representation of the prediction."""
        return {
            'id': self.id,
            'username': self.user.username,
            'text': self.text,
            'created': self.created
        }
