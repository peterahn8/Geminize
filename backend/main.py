from pathlib import Path
from PIL import Image
from decouple import config

import google.generativeai as genai

genai.configure(api_key=config('API_KEY'))

model = genai.GenerativeModel('gemini-pro-vision')

## using pathlib to use main.py as the starting point for filepaths
image_path = Path(__file__).parent / 'images' / 'test.png'
img = Image.open(image_path)

response = model.generate_content(["What is the first value in this image. Only respond with the value itself.", img], stream=True)
response.resolve()
print(response.text)

## try this if you want to see all the properties of the 'response' object above
# for key, value in vars(response).items():
#     print(f"{key}: {value}")