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
from loginRegister.models import Users


# Initialize Supabase client -- need to hide this later TT____TT
SUPABASE_URL = "https://jfzojphxhgpejvffefvo.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmem9qcGh4aGdwZWp2ZmZlZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDU0MDUsImV4cCI6MjA3NDYyMTQwNX0.CDDc3Zja_faSnao3sEMXP_HyFolMMVIhadEsDC5ZS3c"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
# ------------------------------------------------------------------

def main_page(request):
    context = {
        'username': request.user.username,
        'full_name': request.session.get('full_name', ""),
        'email': request.session.get('email', "")
    }
    return render(request, 'main_page.html', context)
