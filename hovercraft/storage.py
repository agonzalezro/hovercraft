"""storage backend.

Keys:


 * user:<email> => [
       "<presentation_id>",
   ]
 * pres:<presentation_id> => {
       "email": <email>,
       "title": <title>,
   }
 * slides:<presentation_id> => "json of everything"

"""

from operator import xor
import uuid
import json

META_FIELDS = ['email', 'title']  # Those get stored in the metadata of the presentation

def user_key(email):
    return ':'.join(['user', email])

def pres_key(presentation_id):
    return ':'.join(['pres', presentation_id])

def slides_key(presentation_id):
    return ':'.join(['slides', presentation_id])

import redis
class Storage(object):
    _backend = redis.StrictRedis(host='localhost', port=6379, db=0)

    def get_json(self, presentation_id):
        '''Returns the json of a presentation.'''
        return self._backend.get(slides_key(presentation_id))

    def get_meta(self, presentation_id, field):
        if field not in META_FIELDS:
            raise ValueError('Meta field {0} not allowed.'.format(field))
        return self._backend.hget(pres_key(presentation_id), field)

    def search(self, email):
        '''Return a list of all presentations of a user.'''
        keys = self._backend.smembers(user_key(email))
        return map(self.get_json, keys)

    def set(self, email, presentation):
        if isinstance(presentation, basestring):
            presentation = json.loads(presentation)
        if not presentation.get('email'):
            presentation['email'] = email
        if not presentation.get('id'):
            presentation['id'] = uuid.uuid4().hex
        elif not self.get_meta(presentation['id'], 'email'):
            raise ValueError('The presentation does not exist')
        if email != presentation['email']:
            raise ValueError('The presentation belongs to another user.')
        pres_email = self.get_meta(presentation['id'], 'email')
        if pres_email and pres_email != email:
            raise ValueError('The presentation already exists and it belongs to another user.')
        self._backend.sadd(user_key(email), presentation['id'])
        self._backend.set(slides_key(presentation['id']), json.dumps(presentation))
        for field in META_FIELDS:
            self._backend.hset(pres_key(presentation['id' ]), field, presentation.get(field))
        return presentation
        
    
    def delete(self, key):
        return self._backend.delete(key)
    
storage = Storage()
