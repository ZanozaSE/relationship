from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('couples', '0002_couplegoal_couplenote'),
    ]

    operations = [
        migrations.AddField(
            model_name='couple',
            name='together_days',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
