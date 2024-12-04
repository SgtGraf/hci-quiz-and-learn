# Quiz and Learn Application

## Setup

Requirements:
- python
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
