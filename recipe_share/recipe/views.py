from django.contrib.auth import logout
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.hashers import make_password
from .models import Users

def landing_page(request):
    return render(request, 'landing_page.html')

def login_page(request):
    return render(request, 'login_page.html')

def log_out(request):
    logout(request)
    return render(request, 'log_out.html')

def signup_page(request):
    if request.method == "POST":
        full_name = request.POST.get("full_name")
        email = request.POST.get("email")
        password = request.POST.get("password")
        confirm_password = request.POST.get("confirmPassword")

        # Check password confirmation
        if password != confirm_password:
            messages.error(request, "Passwords do not match.")
            return redirect("signup_page")

        # Check if email exists
        if Users.objects.filter(email=email).exists():
            messages.error(request, "Email already registered.")
            return redirect("signup_page")

        # Save new user
        Users.objects.create(
            full_name=full_name,
            email=email,
            password=make_password(password)
        )

        messages.success(request, "Account created successfully! Please log in.")
        return redirect("login_page")  # ✅ Go to login page after success

    return render(request, "signup_page.html")