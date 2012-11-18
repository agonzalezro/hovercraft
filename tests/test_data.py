import json
from uuid import uuid4

from hovercraft.storage import storage

def get_test_presentation():
    return {'author': 'agonzalezro@gmail.com',
            'title': 'Presentation ' + uuid4().hex,
            'slides': [{'id': uuid4().hex,
                        'text': 'slide #1',
                        'image_uri': 'http://i.imgur.com/kcWTN.jpg'},
                       {'id': uuid4().hex,
                        'text': 'slide #2',
                        'image_uri': 'http://i.imgur.com/pNSls.jpg'}
                       ]
            }

def cleanup(email):
    """Delete all the shitty presentations."""
    for j in storage.search_json(email):
        p = json.loads(j)
        if ('author' not in p or 'title' not in p or 'slides' not in p
            or not p['slides'] or not isinstance(p['slides'], list)):
            storage.delete(email, p['id'])
    
