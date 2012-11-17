import redis
class Storage(object):
    _backend = redis.StrictRedis(host='localhost', port=6379, db=0)

    def get(self, key):
        return self._backend.get(key)

    def set(self, key, value):
        return self._backend.set(key, value)

    def delete(self, key):
        return self._backend.delete(key)
    
storage = Storage()
