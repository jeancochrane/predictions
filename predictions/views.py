from django.shortcuts import render
from django.views.generic import TemplateView


class Home(TemplateView):
    template_name = 'predictions/index.html'

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args, **kwargs)
        context['props'] = {}  # Set React props
        return context


def page_not_found(request, exception, template_name='predictions/404.html'):
    return render(request, template_name, status=404)


def server_error(request, template_name='predictions/500.html'):
    return render(request, template_name, status=500)
