from django.db import migrations, models


def migrate_together_days_to_start_date(apps, schema_editor):
    Couple = apps.get_model('couples', 'Couple')
    from datetime import timedelta
    from django.utils import timezone

    today = timezone.localdate()
    for couple in Couple.objects.all():
        days = getattr(couple, 'together_days', 0)
        if days > 0:
            couple.relationship_start_date = today - timedelta(days=days)
            couple.save(update_fields=['relationship_start_date'])


class Migration(migrations.Migration):
    dependencies = [
        ('couples', '0003_couple_together_days'),
    ]

    operations = [
        migrations.AddField(
            model_name='couple',
            name='relationship_start_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.RunPython(
            migrate_together_days_to_start_date,
            migrations.RunPython.noop,
        ),
        migrations.RemoveField(
            model_name='couple',
            name='together_days',
        ),
    ]
