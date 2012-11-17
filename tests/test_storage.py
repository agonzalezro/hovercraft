from hovercraft.storage import storage

def test_storage():
    storage.set('hi', 'value')
    assert storage.get('hi') == 'value'
    storage.delete('hi')
    assert storage.get('hi') is None
