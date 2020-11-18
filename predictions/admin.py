from django.contrib import admin

from predictions import models


@admin.register(models.Profile)
class ProfileAdmin(admin.ModelAdmin):
    pass
