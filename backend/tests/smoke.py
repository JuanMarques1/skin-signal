"""Run only against a disposable test deployment: python backend/tests/smoke.py http://localhost:5080"""
import datetime, json, secrets, sys, urllib.request, urllib.error
base = sys.argv[1].rstrip('/')

def call(path, method='GET', body=None, token=None, expected=200):
    headers = {'Content-Type':'application/json'}
    if token: headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(base + path, method=method, headers=headers, data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=60) as response: status, raw = response.status, response.read()
    except urllib.error.HTTPError as error: status, raw = error.code, error.read()
    assert status == expected, f'{method} {path}: expected {expected}, got {status}: {raw[:500]!r}'
    return json.loads(raw) if raw else None

nonce = secrets.token_hex(6)
password = secrets.token_urlsafe(24)
a = call('/api/auth/register','POST',{'name':'Teste A', 'email':f'a-{nonce}@example.test','password':password})
b = call('/api/auth/register','POST',{'name':'Teste B', 'email':f'b-{nonce}@example.test','password':password})
ta, tb = a['accessToken'], b['accessToken']
try:
    call('/api/routine/', expected=401)
    call('/api/routine/', token=tb, expected=404)
    call('/api/auth/login','POST',{'email':f'a-{nonce}@example.test','password':'incorrect'}, expected=401)
    r = call('/api/routine/', 'PUT', {'moment':'both','time':'short','goal':'remember','expectedRevision':None}, ta)
    call('/api/routine/', 'PUT', {'moment':'morning','time':'short','goal':'remember','expectedRevision':None}, ta,409)
    call('/api/routine/', token=tb, expected=404)
    call('/api/routine/', 'PUT', {'moment':'invalid','time':'short','goal':'remember','expectedRevision':r['revision']},ta,400)
    today = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=3)).date().isoformat()
    item = {'date':today,'period':'morning','routineRevision':r['revision'],'checked':[0,1,2]}
    record=call('/api/history','PUT',item,ta)
    call('/api/history','PUT',{**item,'checked':[0]},ta)
    history=call('/api/history',token=ta)
    assert len(history)==1 and history[0]['checked']==[0]
    assert call('/api/history',token=tb)==[]
    call('/api/history/'+record['id'],'DELETE',token=tb,expected=404)
    call('/api/history','PUT',{**item,'checked':[999]},ta,400)
    new = call('/api/routine/', 'PUT', {'moment':'evening','time':'long','goal':'track','expectedRevision':r['revision']},ta)
    old = call('/api/history',token=ta)[0]
    assert old['time']=='short' and old['totalSteps']==3
    call('/api/history','PUT',item,ta,409)
    call('/api/auth/logout','POST',token=ta,expected=204)
    call('/api/me',token=ta,expected=401)
    a2=call('/api/auth/login','POST',{'email':f'a-{nonce}@example.test','password':password})
    ta=a2['accessToken']
    assert call('/api/routine/',token=ta)['revision']==new['revision']
    call('/api/history/'+record['id'],'DELETE',token=ta,expected=204)
    assert call('/api/history',token=ta)==[]
    print('Passed: registration, login, authentication, account isolation, routine revisions, idempotent history, snapshots, validation, deletion, logout and persistence across login.')
finally:
    call('/api/me','DELETE',token=ta,expected=204)
    call('/api/me',token=ta,expected=401)
    call('/api/me','DELETE',token=tb,expected=204)
