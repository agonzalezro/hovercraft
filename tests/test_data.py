from uuid import uuid4

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
