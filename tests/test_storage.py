import json
import uuid
from hovercraft.storage import storage, META_FIELDS
from copy import deepcopy
import pytest

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
    new_presentation = deepcopy(presentation)
    del new_presentation['id']
    new_presentation['slides'] += new_presentation['slides']
    new_pres = storage.set(email, new_presentation)
    jsons = storage.search_json(email)
    presentations = map(json.loads, jsons)
    assert presentations in ([pres, new_pres], [new_pres, pres])
    pres_dict = dict((p['id'], p) for p in presentations)
    metas = storage.search_meta(email)
    for meta in metas:
        pres = pres_dict[meta['id']]
        for field in META_FIELDS:
            assert pres[field] == meta[field]

    
def test_modify_wrong_email(email, presentation):
    pres = storage.set(email, presentation)
    with pytest.raises(ValueError):
        storage.set(email + 'a', presentation)

def test_modify_wrong_id(email, presentation):
    presentation['id'] = uuid.uuid4().hex
    with pytest.raises(ValueError):
        storage.set(email, presentation)
