import os
import json
from functools import wraps

from flask import (Flask, redirect, url_for, session,
                   render_template, abort, request, jsonify,
                   make_response, flash)
from flask_oauth import OAuth
import requests
import feedparser

from hovercraft.storage import storage
from tests.test_data import get_test_presentation, cleanup

GOOGLE_CLIENT_ID = '901545238355.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET = 'pRD_lFRQol-HpByePqDdxikp'
REDIRECT_URI = '/authorize'

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


def _is_authenticated():
    """Returns if the current session is authenticated"""
    return 'email' in session and 'access_token' in session


def auth_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if _is_authenticated():
            return f(*args, **kwargs)
        else:
            return login(request.url)
    return wrapper


@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')


@app.route('/logout')
def logout():
    """The functionality to logout"""
    if _is_authenticated():
        del session['email']
        del session['access_token']
    flash('You have been logged out')
    return redirect(url_for('index'))


@app.route('/search/<query>')
@app.route('/search')
def image_search(query=None):
    if query is None:
        feed = feedparser.parse("http://backend.deviantart.com/rss.xml?type=deviation")
    else:
        feed = feedparser.parse("http://backend.deviantart.com/rss.xml?type=deviation&q={query}".format(query=query))
    images = []
    for item in feed.entries:
        try:
            thumb = first(item.media_thumbnail)
            image = first([x for x in item.media_content if x['medium'] == 'image'])
            images.append({'thumb': thumb, 'image': image})
        except AttributeError:
            pass
    return jsonify({'images': images})


def json_response(data, status_code=200, encode=True):
    if encode:
        data = json.dumps(data)
    return make_response(data, status_code, {'Content-Type': 'application/json'})


@app.route('/presentations')
@auth_required
def handle_list_presentations():
    cleanup(session['email'])

    presentations = storage.search_meta(session['email'])

    if not presentations:
        storage.store_presentation(session['email'], get_test_presentation())
        presentations = storage.search_meta(session['email'])
    if request.accept_mimetypes.accept_html:
        return render_template('list_presentations.html', presentations=presentations)
    elif request.accept_mimetypes.accept_json:
        return json_response(presentations)
    else:
        abort(406)


@app.route('/presentations/<presentation_id>/delete', methods=['POST'])
@auth_required
def handle_delete_presentation(presentation_id):
    storage.delete(session['email'], presentation_id)
    return make_response('', 204)


@app.route('/presentations/<presentation_id>/edit')
@auth_required
def edit_presentation(presentation_id):
    return render_template('editor.html', presentation_id=presentation_id)


@app.route('/presentations/<presentation_id>', methods=['GET', 'POST', 'PUT'])
@auth_required
def handle_presentation(presentation_id):
    if (not request.accept_mimetypes.accept_html
        and not request.accept_mimetypes.accept_json):
        abort(406)

    if request.method in ['POST', 'PUT']:
        storage.store_slides(presentation_id, session['email'], request.json)

    data = storage.get_json(presentation_id)
    if request.accept_mimetypes.accept_html:
        return render_template('presentation.html', pres=json.loads(data))
    elif request.accept_mimetypes.accept_json:
        return json_response(data, encode=False)


def login(redirect_uri=''):
    session['oauth_redirect'] = redirect_uri
    return google.authorize(callback=url_for('authorized', _external=True))


@app.route(REDIRECT_URI)
@google.authorized_handler
def authorized(resp):
    url = 'https://www.googleapis.com/oauth2/v1/userinfo'
    headers = {'Authorization': 'OAuth ' + resp['access_token']}
    r = requests.get(url, headers=headers)

    if not r.json.get('verified_email'):
        abort(500)

    session['access_token'] = resp['access_token']
    session['email'] = r.json['email']
    uri = session.pop('oauth_redirect', url_for('index'))

    return redirect(uri)


@google.tokengetter
def get_access_token():
    return session.get('access_token')


def run():
    port = os.environ.get('PORT', 5000)
    app.run(host='0.0.0.0', port=int(port))


def first(items):
    try:
        return items[0]
    except IndexError:
        return items


if __name__ == '__main__':
    run()
