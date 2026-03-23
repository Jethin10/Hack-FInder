import urllib.request,time,sys 
urls=['http://127.0.0.1:3000','http://127.0.0.1:8787/api/health'] 
ok=[False,False] 
for _ in range(45): 
    for i,u in enumerate(urls): 
        if ok[i]: 
            continue 
        try: 
            r=urllib.request.urlopen(u,timeout=3) 
            ok[i]= (r.status==200) 
        except Exception: 
            pass 
    if all(ok): 
        break 
    time.sleep(1) 
print('web',ok[0],'api',ok[1]) 
sys.exit(0 if all(ok) else 1) 
