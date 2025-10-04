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

# Initialize Supabase client -- need to hide this later TT____TT
SUPABASE_URL = "https://jfzojphxhgpejvffefvo.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmem9qcGh4aGdwZWp2ZmZlZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDU0MDUsImV4cCI6MjA3NDYyMTQwNX0.CDDc3Zja_faSnao3sEMXP_HyFolMMVIhadEsDC5ZS3c"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
# ------------------------------------------------------------------

def landing_page(request):
    return render(request, 'landing_page.html')

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
            # Get user from Supabase 'users' table
            response = supabase.table('users').select('*').eq('email', email).execute()
            
            print(f"Supabase response: {response.data}")
            
            # Check if user exists
            if response.data and len(response.data) > 0:
                user_data = response.data[0]
                stored_password = user_data.get('password')
                
                # DEBUG: Print password info
                print(f"User found: {user_data.get('full_name')}")
                print(f"Email: {email}")
                print(f"Input password length: {len(password)}")
                print(f"Stored password: {stored_password[:60]}...")
                print(f"Password starts with 'pbkdf2': {stored_password.startswith('pbkdf2')}")
                
                password_valid = check_password(password, stored_password)
                print(f"Password check result: {password_valid}")
                
                # Verify password using check_password for hashed passwords
                if password_valid:
                    # Get/Create Django user for session management
                    user, created = User.objects.get_or_create(
                        username=email,
                        defaults={
                            'email': email,
                            'first_name': user_data.get('full_name', '')
                        }
                    )
                    
                    # Store user data in session for easy access
                    request.session['user_id'] = user_data.get('id')
                    request.session['full_name'] = user_data.get('full_name')
                    request.session['email'] = user_data.get('email')
                    
                    # Log the user into Django
                    login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                    
                    if request.headers.get("x-requested-with") == "XMLHttpRequest":
                        return JsonResponse({"success": True, "redirect_url": "/main/"})
                    return redirect("main_page")
                else:
                    # Wrong password
                    error_message = "Invalid email or password"
            else:
                # User not found
                error_message = "Invalid email or password"
            
            # Handle errors
            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse({"success": False, "error": error_message}, status=400)
            return render(request, "login_page.html", {
                "error": error_message,
                "email": email
            })
                
        except Exception as e:
            print(f"Login error: {str(e)}")
            error_message = "Invalid email or password"
            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse({"success": False, "error": error_message}, status=400)
            return render(request, "login_page.html", {
                "error": error_message,
                "email": email
            })

    return render(request, "login_page.html")

from django.contrib.auth import logout
from django.shortcuts import redirect, render
from django.http import JsonResponse

def log_out(request):
    if request.method == "POST":
        # Destroy Django session
        logout(request)
        request.session.flush()   # extra cleanup

        # Return JSON if it’s an API request
        if request.headers.get("x-requested-with") == "XMLHttpRequest":
            return JsonResponse({"success": True, "redirect_url": "/login/"})

        # Normal flow → redirect to login page
        return redirect("login_page")

    # GET → show confirmation modal
    return render(request, "log_out.html")



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

def main_page(request):
    context = {
        'username': request.user.username,
        'full_name': request.session.get('full_name', request.user.first_name),
        'email': request.session.get('email', request.user.email)
    }
    return render(request, 'main_page.html', context)

def create_page(request):
    context = {
        'username': request.user.username,
        'full_name': request.session.get('full_name', request.user.first_name),
        'email': request.session.get('email', request.user.email)
    }
    return render(request, 'create_page.html', context)