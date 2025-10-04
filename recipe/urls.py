from django.urls import path
from . import views

urlpatterns = [
    path('', views.landing_page, name='landing_page'),
    path('login/', views.login_page, name='login_page'),
    path('logout/', views.log_out, name='log_out'),
    path('signup/', views.signup_page, name='signup_page'),
    path('main/', views.main_page, name='main_page'),
    path('create_recipe/', views.create_page, name='create_page'),
]

