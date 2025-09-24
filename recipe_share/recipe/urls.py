from django.urls import path
from . import views

urlpatterns = [
    path('', views.landing_page, name='landing_page'),
    path('logout/', views.log_out, name='log_out'),
]
