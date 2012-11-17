from flask import Flask, redirect, url_for, session, jsonify, render_template, abort
from flask_oauth import OAuth
import json
import requests
import feedparser
from hovercraft.storage import storage

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

@app.route('/search/<query>')
def image_search(query):
    feed = feedparser.parse("http://backend.deviantart.com/rss.xml?type=deviation&q={query}".format(query=query))
    images = []
    for item in feed.entries:
        try:
            thumb = first(item.media_thumbnail)
            image = first([x for x in item.media_content if x['medium'] == 'image'])
            images.append({'thumb': thumb, 'image': image})
        except AttributeError:
            pass
    return json.dumps(images)


@app.route('/')
def index():
    return render_template('editor.html', id=1)


@app.route('/presentations')
def presentations():
    if 'email' not in session or 'access_token' not in session:
        return login('presentations')
    presentations = storage.search_meta(session['email'])
    if not presentations:
        storage.set(session['email'], {'slides': 'fun', 'title': 'Some Presentation'})
        presentations = storage.search_meta(session['email'])
    print presentations
    return render_template('list_presentations.html', presentations=presentations)


@app.route('/presentations/<presentation_id>')
def presentation(presentation_id):
    if 'email' not in session or 'access_token' not in session:
        return login('presentation', presentation_id=presentation_id)
    return storage.get_json(presentation_id)

def login(endpoint='', **values):
    session['oauth_redirect'] = endpoint, values
    return google.authorize(callback=url_for('authorized', _external=True))



@app.route(REDIRECT_URI)
@google.authorized_handler
def authorized(resp):
    url = 'https://www.googleapis.com/oauth2/v1/userinfo'
    headers = {'Authorization': 'OAuth '+resp['access_token']}
    r = requests.get(url, headers=headers)

    if r.json.get('verified_email') != True:
        abort(500)

    session['access_token'] = resp['access_token']
    session['email'] = r.json['email']
    endpoint, values = session.pop('oauth_redirect', ('index', {}))

    return redirect(url_for(endpoint, **values))


@google.tokengetter
def get_access_token():
    return session.get('access_token')


def run():
    app.run()


def first(items):
    try:
        return items[0]
    except IndexError:
        return items


if __name__ == '__main__':
    run()
