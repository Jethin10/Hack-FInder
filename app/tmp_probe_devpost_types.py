import json,urllib.parse,urllib.request 
types=['online','in-person','hybrid','all'] 
for t in types: 
    q=urllib.parse.urlencode([('challenge_type[]',t),('status[]','open'),('page','1')]) 
    u='https://devpost.com/api/hackathons?'+q 
    req=urllib.request.Request(u,headers={'User-Agent':'HackHuntBot/1.0','Accept':'application/json'}) 
    try: 
        data=json.loads(urllib.request.urlopen(req,timeout=30).read().decode('utf-8','ignore')) 
        print(t,len(data.get('hackathons',[])),data.get('meta',{}).get('total_count')) 
    except Exception as e: 
        print(t,'err',e) 
