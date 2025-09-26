from django.shortcuts import render, redirect
from django.contrib.auth import logout

def landing_page(request):
    return render(request, 'landing_page.html')

def login_page(request):
    return render(request, 'login_page.html')

def log_out(request):
    logout(request)
    return render(request, 'log_out.html')

def signup_page(request):
    return render(request, 'signup_page.html')
