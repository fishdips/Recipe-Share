from django.urls import path
from . import views

urlpatterns = [
    path('', views.create_page, name='create_page'),
]