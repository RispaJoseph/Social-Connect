from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'


    # Profile auto-creation logic
    def ready(self):                            #signals are connected when the app is initialized.
        import accounts.signals
