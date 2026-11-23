import json, urllib.request, urllib.error, http.cookiejar
from datetime import date, timedelta
base='http://127.0.0.1:8070/api/v1'
jar=http.cookiejar.CookieJar(); opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
def req(path,method='GET',data=None,headers=None):
 body=None if data is None else json.dumps(data).encode()
 h={'Content-Type':'application/json',**(headers or {})}
 r=urllib.request.Request(base+path,data=body,headers=h,method=method)
 try: return json.loads(opener.open(r).read())
 except urllib.error.HTTPError as e: raise RuntimeError(f'{method} {path} {e.code}: {e.read().decode()[:500]}')
def next_day():
 d=date.today()+timedelta(days=1)
 while d.weekday()==6:d+=timedelta(days=1)
 return d.isoformat()
login=req('/auth/login','POST',{'email':'closure-owner-1794985086236@example.com','password':'DemoOwner-2026-Strong'})
h={'X-CSRF-Token':login['csrf_token']}
dash=req('/admin/dashboard',headers=h);print('dashboard_orders',dash['orders']['total'],'active_products',dash['products']['active'])
collections=req('/collections'); product={'name':'Live Demo QA Bouquet','collection_id':collections[0]['id'],'short_description':'QA draft','description':'Created through the live admin API','images':[{'src':'art://blush/rose/live-qa/full','alt':'Live QA','position':0}],'variants':[{'size':'classic','label':'Classic','price_cents':6000,'stock_qty':4,'sku':'LIVE-QA-C2'},{'size':'deluxe','label':'Deluxe','price_cents':8000,'stock_qty':3,'sku':'LIVE-QA-D2'},{'size':'grand','label':'Grand','price_cents':10000,'stock_qty':2,'sku':'LIVE-QA-G2'}]}
try:
 created=req('/admin/products','POST',product,h); print('created_draft',created['slug'],created['status'])
except RuntimeError as e:
 if 'already exists' not in str(e): raise
 existing=[x for x in req('/admin/products',headers=h) if x.get('name')==product['name']][0]; created=existing; print('reused_existing',created['slug'],created['status'])
published=req(f"/admin/products/{created['id']}/publish",'POST',None,h);print('published',published['slug'],published['status'])
public=req(f"/products/{published['slug']}");print('public_sync',public['name'],public['status'])
site=req('/site'); window=site['delivery']['windows'][0]['id']; variant=public['variants'][0]
checkout={'customer':{'first_name':'Demo','last_name':'Customer','email':'demo.customer@example.com','phone':'4155550199'},'recipient':{'name':'Demo Customer','line1':'1 Petal Lane','line2':'','city':'Arcadia','state':'CA','postal_code':'94107'},'lines':[{'variant_id':variant['id'],'quantity':1}],'delivery_date':next_day(),'window_id':window,'gift_message':'Demo order','client_subtotal_cents':variant['price_cents'],'consent':True}
order=req('/checkout','POST',checkout,{'Idempotency-Key':'live-demo-order-001'});print('order_created',order['number'],order['status'],order['total_cents'])
admin_orders=req('/admin/orders',headers=h);print('admin_order_sync',any(x['id']==order['id'] for x in admin_orders),len(admin_orders))
