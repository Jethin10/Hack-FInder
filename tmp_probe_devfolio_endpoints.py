import urllib.request,re 
html=urllib.request.urlopen('https://devfolio.co/hackathons',timeout=30).read().decode('utf-8','ignore') 
