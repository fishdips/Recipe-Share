from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

def landing_page(request):
    return render(request, 'landing_page.html')

def login_page(request):
    return render(request, 'login_page.html')

def log_out(request):
    logout(request)
    return render(request, 'log_out.html')

def main_page(request):
    return render(request, 'main_page.html', {'username': request.user.username})

def signup_page(request):
    # vv check rako verification hehe ignore below vv

    # if request.method == 'POST':
    #     email = request.POST.get('email')
    #     username = request.POST.get('username')
    #     password = request.POST.get('password')

    #     if User.objects.filter(email=email).exists():
    #         return render(request, 'signup.html', {'error': 'Email already registered'})

    #     user = User.objects.create_user(username=username, email=email, password=password)
    #     login(request, user)
    #     return redirect('main_page')
    return render(request, 'signup_page.html')

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
            user_obj = User.objects.get(email=email)
            user = authenticate(request, username=user_obj.username, password=password)
        except User.DoesNotExist:
            user = None

        if user is not None:
            login(request, user)
            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse({"success": True, "redirect_url": "/main/"})
            return redirect("main_page")
        else:
            error_message = "Invalid email or password"
            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse({"success": False, "error": error_message}, status=400)
            # Pass back values so form keeps what user typed
            return render(request, "login_page.html", {
                "error": error_message,
                "email": email
            })

    return render(request, "login_page.html")



