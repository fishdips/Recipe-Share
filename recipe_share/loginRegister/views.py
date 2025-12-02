from django.shortcuts import render
from django.contrib.auth import logout
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.models import User
from .models import Users
from django.contrib.auth import login
from django.views.decorators.csrf import csrf_exempt
import json
from django.http import JsonResponse
from supabase import create_client, Client
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import redirect, render

# Initialize Supabase client -- need to hide this later TT____TT
SUPABASE_URL = "https://jfzojphxhgpejvffefvo.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmem9qcGh4aGdwZWp2ZmZlZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDU0MDUsImV4cCI6MjA3NDYyMTQwNX0.CDDc3Zja_faSnao3sEMXP_HyFolMMVIhadEsDC5ZS3c"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


@csrf_exempt
def login_page(request):
    if request.method == "POST":
        print("=" * 50)
        print("LOGIN ATTEMPT STARTED")
        
        try:
            data = json.loads(request.body.decode("utf-8"))
            email = data.get("email")
            password = data.get("password")
            print(f"Parsed JSON - Email: {email}")
        except json.JSONDecodeError:
            email = request.POST.get("email")
            password = request.POST.get("password")
            print(f"Parsed FormData - Email: {email}")

        if not email or not password:
            print("ERROR: Missing email or password")
            return JsonResponse({"success": False, "error": "Missing credentials"}, status=400)

        try:
            print(f"Querying Supabase for email: {email}")
            response = supabase.table('users').select('*').eq('email', email).execute()

            print(f"Supabase response: {response.data}")

            if response.data and len(response.data) > 0:
                user_data = response.data[0]
                stored_password = user_data.get('password')

                print(f"User found: {user_data.get('full_name')}")
                print(f"Stored password: {stored_password[:60]}...")

                password_valid = check_password(password, stored_password)

                print(f"Password match: {password_valid}")

                if password_valid:

                    request.session['user_id'] = user_data.get('id')
                    request.session['full_name'] = user_data.get('full_name')
                    request.session['email'] = user_data.get('email')
                    request.session['is_authenticated'] = True  

                    print("Custom user logged in (Supabase)")

                    if request.headers.get("x-requested-with") == "XMLHttpRequest":
                        return JsonResponse({"success": True, "redirect_url": "/main/"})
                    return redirect("main_page")

                else:
                    error_message = "Invalid email or password"
            else:
                error_message = "Invalid email or password"

            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse({"success": False, "error": error_message}, status=400)

            return render(request, "login_page.html", {
                "error": error_message,
                "email": email,
            })

        except Exception as e:
            print(f"Login error: {str(e)}")
            error_message = "Invalid email or password"

            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse({"success": False, "error": error_message}, status=400)

            return render(request, "login_page.html", {
                "error": error_message,
                "email": email,
            })

    return render(request, "login_page.html")



def signup_page(request):
    if request.method == "POST":
        full_name = request.POST.get("full_name")
        email = request.POST.get("email")
        password = request.POST.get("password")
        confirm_password = request.POST.get("confirmPassword")

        if password != confirm_password:
            messages.error(request, "Passwords do not match.")
            return redirect("signup_page")

        if Users.objects.filter(email=email).exists():
            messages.error(request, "Email already registered.")
            return redirect("signup_page")

        
        Users.objects.create(
            full_name=full_name,
            email=email,
            password=make_password(password)
        )

        messages.success(request, "Account created successfully! Please log in.")
        return redirect("login_page")  

    return render(request, "signup_page.html")

def forgot_password(request):
    if request.method == "POST":

        if "new_password" in request.POST:
            email = request.session.get("reset_email")

            if not email:
                return redirect("forgot_password")

            new_pass = request.POST.get("new_password")
            confirm_pass = request.POST.get("confirm_password")

            if new_pass != confirm_pass:
                return render(request, "forgot_password.html", {
                    "step2": True,
                    "error": "Passwords do not match."
                })

            hashed_new_password = make_password(new_pass)

            supabase.table("users").update({
                "password": hashed_new_password
            }).eq("email", email).execute()

            del request.session["reset_email"]

            messages.success(request, "Password updated successfully. Please log in.")
            return redirect("login_page")

        email = request.POST.get("email")
        old_pass = request.POST.get("old_password")

        user_response = supabase.table("users").select("*").eq("email", email).execute()

        if not user_response.data:
            return render(request, "forgotpassword_page.html", {
                "error": "Email not found."
            })

        user = user_response.data[0]
        stored_password = user.get("password")

        if not check_password(old_pass, stored_password):
            return render(request, "forgot_password.html", {
                "error": "Old password is incorrect."
            })

        request.session["reset_email"] = email

        return render(request, "forgotpassword_page.html", {
            "step2": True
        })

    return render(request, "forgotpassword_page.html")
