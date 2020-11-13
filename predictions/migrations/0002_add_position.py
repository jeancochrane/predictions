# Generated by Django 3.1.3 on 2020-11-13 19:11

from django.db import migrations, models
import predictions.models


class Migration(migrations.Migration):

    dependencies = [
        ('predictions', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='prediction',
            name='position_x',
            field=models.IntegerField(default=predictions.models.random_x),
        ),
        migrations.AddField(
            model_name='prediction',
            name='position_y',
            field=models.IntegerField(default=predictions.models.random_y),
        ),
    ]
