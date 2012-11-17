import redis
class Storage(object):
    storage = redis.StrictRedis(host='localhost', port=6379, db=0)

    def get(self, key):
        return self.storage.get(key)

    def set(self, key, value):
        return self.storage.set(key, value)

storage = Storage()
