from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from supabase import create_client, Client

# Initialize Supabase client -- need to hide this later TT____TT
SUPABASE_URL = "https://jfzojphxhgpejvffefvo.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmem9qcGh4aGdwZWp2ZmZlZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDU0MDUsImV4cCI6MjA3NDYyMTQwNX0.CDDc3Zja_faSnao3sEMXP_HyFolMMVIhadEsDC5ZS3c"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
# ------------------------------------------------------------------

def landing_page(request):
    return render(request, 'landing_page.html')

def log_out(request):
    logout(request)
    return render(request, 'log_out.html')

def main_page(request):
    return render(request, 'main_page.html', {'username': request.user.username})
    

def signup_page(request):
    return render(request, 'signup_page.html')

def create_page(request):
    return render(request, 'create_page.html', {'username': request.user.username})

@csrf_exempt
def login_page(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode("utf-8"))
            email = data.get("email")
            password = data.get("password")
        except json.JSONDecodeError:
            email = request.POST.get("email")
            password = request.POST.get("password")

        try:
            response = supabase.table('users').select('*').eq('email', email).eq('password', password).execute()
            
            # Check if user exists
            if response.data and len(response.data) > 0:
                user_data = response.data[0]
                
                # Get/Create Django user
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={'username': user_data.get('full_name', email.split('@')[0])}
                )
                
                # Log the user into Django
                login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                
                if request.headers.get("x-requested-with") == "XMLHttpRequest":
                    return JsonResponse({"success": True, "redirect_url": "/main/"})
                return redirect("main_page")
            else:
                error_message = "Invalid email or password"
                if request.headers.get("x-requested-with") == "XMLHttpRequest":
                    return JsonResponse({"success": False, "error": error_message}, status=400)
                return render(request, "login_page.html", {
                    "error": error_message,
                    "email": email
                })
                
        except Exception as e:
            error_message = "Invalid email or password"
            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse({"success": False, "error": error_message}, status=400)
            return render(request, "login_page.html", {
                "error": error_message,
                "email": email
            })

    return render(request, "login_page.html")