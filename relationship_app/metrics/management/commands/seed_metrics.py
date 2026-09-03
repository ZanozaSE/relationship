from django.core.management.base import BaseCommand

from metrics.models import MetricTemplate


class Command(BaseCommand):
    help = 'Создаёт предустановленные метрики'

    def handle(self, *args, **options):
        metrics = [
            {
                'name': 'Личное пространство',
                'scale_type': MetricTemplate.ScaleType.BALANCE,
                'min_value': -100,
                'max_value': 100,
                'target_value': 0,
                'left_label': 'Мало',
                'right_label': 'Много',
                'sort_order': 1,
            },
            {
                'name': 'Совместное время (вживую)',
                'scale_type': MetricTemplate.ScaleType.BALANCE,
                'min_value': -100,
                'max_value': 100,
                'target_value': 0,
                'left_label': 'Много',
                'right_label': 'Мало',
                'sort_order': 2,
            },
            {
                'name': 'Совместное время (переписки, онлайн игры)',
                'scale_type': MetricTemplate.ScaleType.BALANCE,
                'min_value': -100,
                'max_value': 100,
                'target_value': 0,
                'left_label': 'Много',
                'right_label': 'Мало',
                'sort_order': 3,
            },
            {
                'name': 'Качество быта',
                'scale_type': MetricTemplate.ScaleType.BALANCE,
                'min_value': -100,
                'max_value': 100,
                'target_value': 0,
                'left_label': 'Ты',
                'right_label': 'Партнёр',
                'sort_order': 4,
            },
            {
                'name': 'Эмоциональная близость',
                'scale_type': MetricTemplate.ScaleType.LEVEL,
                'min_value': 0,
                'max_value': 100,
                'target_value': 100,
                'left_label': '0',
                'right_label': '100',
                'sort_order': 5,
            },
            {
                'name': 'Интимная жизнь',
                'scale_type': MetricTemplate.ScaleType.BALANCE,
                'min_value': -100,
                'max_value': 100,
                'target_value': 0,
                'left_label': 'Мало',
                'right_label': 'Много',
                'sort_order': 6,
            },
        ]

        for metric in metrics:
            MetricTemplate.objects.update_or_create(
                name=metric['name'],
                defaults=metric
            )

        self.stdout.write(
            self.style.SUCCESS(
                'Предустановленные метрики успешно созданы.'
            )
        )