from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('couples', '0004_relationship_start_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='couplenote',
            name='is_private',
            field=models.BooleanField(default=False),
        ),
    ]
