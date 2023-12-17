import pathlib
import textwrap

from decouple import config
from PIL import Image
import google.generativeai as genai

genai.configure(api_key=config('API_KEY'))

model = genai.GenerativeModel('gemini-pro-vision')

# response = model.generate_content("What is the meaning of life?")
# print(response.text)

image_path = './images/test.png' 
img = Image.open(image_path)

response = model.generate_content(["What is the first value in this image. Only respond with the value itself.", img], stream=True)
response.resolve()
print(response.text)

## try this if you want to see all the properties of the 'response' object above
# for key, value in vars(response).items():
#     print(f"{key}: {value}")