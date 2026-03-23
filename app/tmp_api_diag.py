import json,urllib.request 
data=json.loads(urllib.request.urlopen('http://127.0.0.1:8787/api/hackathons?limit=1',timeout=20).read().decode('utf-8','ignore')) 
print('api_total',data.get('total')) 
print('api_generated',data.get('generatedAt')) 
