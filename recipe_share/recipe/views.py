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
        try:
            try:
                full_name = request.POST.get("full_name")
                email = request.POST.get("email")
                password = request.POST.get("password")
                confirm_password = request.POST.get("confirmPassword")
            except Exception as e:
                print("Error getting POST data:", e)
                messages.error(request, "Error reading form data.")
                return redirect("signup_page")

            try:
                if password != confirm_password:
                    messages.error(request, "Passwords do not match.")
                    return redirect("signup_page")
            except Exception as e:
                print("Error checking password confirmation:", e)
                messages.error(request, "Password check failed.")
                return redirect("signup_page")

            # Step 3: Check if email exists
            try:
                if Users.objects.filter(email=email).exists():
                    messages.error(request, "Email already registered.")
                    return redirect("signup_page")
            except Exception as e:
                print("Error checking email existence:", e)
                messages.error(request, "Error checking email.")
                return redirect("signup_page")

            # Step 4: Create new user
            try:
                Users.objects.create(
                    full_name=full_name,
                    email=email,
                    password=make_password(password)
                )
            except Exception as e:
                print("Error creating user:", e)
                messages.error(request, "Error saving user.")
                return redirect("signup_page")

            # Step 5: Success
            messages.success(request, "Account created successfully! Please log in.")
            return redirect("login_page")

        except Exception as e:
            # Catch any unexpected errors
            print("Unexpected signup error:", e)
            messages.error(request, "An unexpected error occurred. Check console.")
            return redirect("signup_page")

    return render(request, "signup_page.html")
