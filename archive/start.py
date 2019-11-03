#!/usr/bin/python
import datetime
import os

name = "package"

if __name__ == '__main__':
    path = os.path.dirname(os.path.realpath(__file__))
    cmd = '/Applications/nwjs/nwjs.app/Contents/MacOS/nwjs "'+path+'/' + name+'"'
    os.system(cmd);