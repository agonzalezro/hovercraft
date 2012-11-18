#!/usr/bin/env python

from setuptools import setup, find_packages

setup(name='hovercraft',
      version='0.1',
      description='Hovercraft Slides',
      author='Pygrunn',
      install_requires=[
        'flask',
        'flask_oauth',
        'redis',
        'requests',
        'pytest',
        'feedparser',
        ],
      packages=find_packages(),
      entry_points={'console_scripts': ['hovercraftd=hovercraft.server:run']},
)
