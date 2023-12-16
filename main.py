import os
import pathlib
import textwrap

from decouple import config
import google.generativeai as genai

genai.configure(api_key=config('API_KEY'))

# model = genai.GenerativeModel('gemini-pro')

# response = model.generate_content("What is the meaning of life?")
# print(response.text)
