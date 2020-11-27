from django.conf import settings
from django.shortcuts import render
from django.views.generic import TemplateView
from django.urls import reverse

from predictions import models


class Home(TemplateView):
    template_name = 'predictions/index.html'

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args, **kwargs)
        predictions = models.Prediction.objects.all()
        messages = models.ChatMessage.objects.all()
        context['props'] = {
            'predictions': [prediction.as_dict() for prediction in predictions],
            'messages': [message.as_dict() for message in messages],
            'userId': self.request.user.id,
            'loginUrl': f'{reverse("admin:login")}?next={reverse("home")}',
            'isActive': settings.PREDICTIONS_ACTIVE,
            'userHasPermissions': models.user_can_manage_predictions(
                self.request.user
            ),
            'userMap': models.get_user_info()
        }
        return context


def page_not_found(request, exception, template_name='predictions/404.html'):
    return render(request, template_name, status=404)


def server_error(request, template_name='predictions/500.html'):
    return render(request, template_name, status=500)
