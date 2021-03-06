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
        game_is_active = settings.GAME_IS_ACTIVE()
        context['props'] = {
            'predictions': [prediction.as_dict() for prediction in predictions],
            'messages': [message.as_dict() for message in messages],
            'userId': self.request.user.id,
            'loginUrl': reverse("login"),
            'isActive': game_is_active,
            'userHasPermissions': models.user_can_manage_predictions(
                self.request.user
            ),
            'userMap': models.get_user_info()
        }
        if not game_is_active:
            context['props']['dateMessage'] = settings.GET_DATE_MESSAGE()
        return context


class Guidelines(TemplateView):
    template_name = 'predictions/guidelines.html'


def page_not_found(request, exception, template_name='predictions/404.html'):
    return render(request, template_name, status=404)


def server_error(request, template_name='predictions/500.html'):
    return render(request, template_name, status=500)
