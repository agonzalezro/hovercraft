from functools import wraps
from flask import Flask, redirect, url_for, session, request, jsonify
from flask_oauth import OAuth
import json
import os.path

# You must configure these 3 values from Google APIs console
# https://code.google.com/apis/console
GOOGLE_CLIENT_ID = '877154630036.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET = 'XEHrVj74Feff2nwuNryhvLt7'
REDIRECT_URI = '/authorize'  # one of the Redirect URIs from Google APIs console

SECRET_KEY = 'development key'
DEBUG = True

app = Flask(__name__)
app.debug = DEBUG
app.secret_key = SECRET_KEY
oauth = OAuth()

google = oauth.remote_app('google',
                          base_url='https://www.google.com/accounts/',
                          authorize_url='https://accounts.google.com/o/oauth2/auth',
                          request_token_url=None,
                          request_token_params={'scope': 'https://www.googleapis.com/auth/userinfo.email',
                                                'response_type': 'code'},
                          access_token_url='https://accounts.google.com/o/oauth2/token',
                          access_token_method='POST',
                          access_token_params={'grant_type': 'authorization_code'},
                          consumer_key=GOOGLE_CLIENT_ID,
                          consumer_secret=GOOGLE_CLIENT_SECRET)

@app.route('/json/<int:presentation_id>')
def presentation_json(presentation_id):
    return jsonify({'id': presentation_id,
            'author': 'agonzalezro@gmail.com',
            'slides': [{'text': 'slide #1'},
                       {'text': 'slide #2'}]
           })


@app.route('/')
def index():
    access_token = session.get('access_token')
    if access_token is None:
        return redirect(url_for('login'))

    access_token = access_token[0]
    from urllib2 import Request, urlopen, URLError

    headers = {'Authorization': 'OAuth '+access_token}
    req = Request('https://www.googleapis.com/oauth2/v1/userinfo',
                  None, headers)
    try:
        res = urlopen(req)
    except URLError, e:
        if e.code == 401:
            # Unauthorized - bad token
            session.pop('access_token', None)
            return redirect(url_for('login'))
        return res.read()
    user_info = json.loads(res.read())
    if user_info['verified_email']:
        session['email'] = user_info['email']
    redirect_url = request.args.get('redirect')
    if redirect_url:
        return redirect(redirect_url)
    return open(os.path.join(os.path.dirname(__file__), '..', 'editor', 'index.html')).read()

@app.route('/editor.js')
def editor_js():
    return open(os.path.join(os.path.dirname(__file__), '..', 'editor', 'editor.js')).read()



@app.route('/login')
def login():
    callback=url_for('authorized', _external=True)
    return google.authorize(callback=callback)



@app.route(REDIRECT_URI)
@google.authorized_handler
def authorized(resp):
    access_token = resp['access_token']
    session['access_token'] = access_token, ''
    return redirect(url_for('index'))


def private(f):
     @wraps(f)
     def wrapper(*args, **kwds):
         if 'email' in session:
             return f(*args, **kwds)
         else:
             return redirect('/?redirect=' + request.url)
     return wrapper

@app.route('/test')
@private
def mytest():
    email = session['email']
    del session['email']
    return "Hello, {0}!".format(email)


@google.tokengetter
def get_access_token():
    return session.get('access_token')


def run():
    app.run()


if __name__ == '__main__':
    run()
