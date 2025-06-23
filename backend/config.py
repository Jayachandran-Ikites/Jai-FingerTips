import os
from dotenv import load_dotenv      

load_dotenv() 

# MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://FingerTIPS:Finger%40Tips@fingertips.usnb8kc.mongodb.net/?retryWrites=true&w=majority&appName=Fingertips")
MONGO_URI = os.getenv("MONGO_URI")
SECRET_KEY = os.getenv("SECRET_KEY")
DATABASE_NAME = "Fingertips"
