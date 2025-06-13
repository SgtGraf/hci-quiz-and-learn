# Quiz and Learn Application

## Setup

Requirements:
- python (Version <=3.11.9 required!)
- pip

Create an .env file that contains the Openai API key:

` OPENAI_API_KEY=<my openai api key> `

Create a virtual environment in the folder of your choice (here: env) :

` python -m venv env `

Envoke the virtual environment:

` source env/bin/activate `

Install the required packages:

` pip install -r requirements.txt `


## Flask server

The flask server contains api calls to get questions and answers from the backend.
/api/question_answers
/api/questions
/api/answers

### Run the flask server

` cd backend/python-scripts `
` python flask_app.py `

Running on http://127.0.0.1:7990

### Run the frontend

`cd my-angular-app `

`ng serve `


## How to Set Up OpenAI API Key

1. Go to [openai.com](https://openai.com/) and log in on the API platform.

2. Go to **Settings → Billing** and add a payment method.

3. Then go to **Settings → API Keys**. Create a new secret key.

4. Copy and save the value immediately (this is sensitive and cannot be retrieved again).

5. Go into your project, into the `backend/` folder.

6. Create a file called `.env`.  
   (This file is excluded from pushes via `.gitignore`, but double-check that you never push it to the repository.)

7. Add the following line into the `.env` file:

    ```env
    OPENAI_API_KEY=your_copied_api_key_here
    ```
    
8. Save the file. The backend will now be able to access the OpenAI API securely.

