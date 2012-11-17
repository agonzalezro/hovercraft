import json
import uuid
from hovercraft.storage import storage
from copy import copy


def pytest_funcarg__email(request):
    return '{0}@example.com'.format(uuid.uuid4().hex)


def pytest_funcarg__presentation(request):
    email = request.getfuncargvalue('email')
    return {'email': email,
            'title': uuid.uuid4().hex,
            'slides': ['hi']}


def test_create(email, presentation):
    pres = storage.set(email, presentation)
    assert pres['email'] == email
    assert pres['id']
    assert storage.get_meta(pres['id'], 'title') == pres['title']
    assert storage.get_meta(pres['id'], 'email') == pres['email']
    assert json.loads(storage.get_json(pres['id'])) == pres


def test_search(email, presentation):
    pres = storage.set(email, presentation)
    new_presentation = copy(presentation)
    new_pres = storage.set(email, new_presentation)
    result = storage.search(email)
    1/0
    
