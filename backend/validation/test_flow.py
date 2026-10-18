"""Integração em SQLite isolado; não substitui validação da migração no PostgreSQL."""
import asyncio
from datetime import datetime, timezone, timedelta
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import httpx
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.main import app
from app.api.deps import get_db
from app.models import Base, User, Category, Claim, Item
from app.models.enums import UserRole
from app.core.security import hash_password, create_access_token

async def main():
    engine = create_async_engine('sqlite+aiosqlite:///:memory:')
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    async def database():
        async with sessions() as session:
            yield session
    app.dependency_overrides[get_db] = database
    async with sessions() as session:
        admin = User(name='Admin', email='admin@example.com', password_hash=hash_password('password123'), role=UserRole.ADMIN)
        user = User(name='Pessoa', email='user@example.com', password_hash=hash_password('password123'), role=UserRole.USER)
        stranger = User(name='Outro', email='other@example.com', password_hash=hash_password('password123'), role=UserRole.USER)
        category = Category(name='Eletrônicos')
        session.add_all([admin, user, stranger, category]); await session.commit()
        admin_id, user_id, stranger_id, cat_id = admin.id, user.id, stranger.id, category.id
    def auth(user_id, role):
        return {'Authorization': 'Bearer '+create_access_token(str(user_id), role)}
    ah, uh, sh = auth(admin_id,'ADMIN'), auth(user_id,'USER'), auth(stranger_id,'USER')
    checks = []
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
        async def call(method, path, headers, expected=200, data=None):
            result = await client.request(method, '/api/v1'+path, headers=headers, json=data)
            assert result.status_code == expected, (method,path,result.status_code,result.text)
            checks.append(f'{method} {path}: {expected}')
            return result.json() if result.content else None
        staff_data = {'name':'Funcionário','email':'staff@example.com','password':'password123'}
        await call('POST','/admin/staff',uh,403,staff_data)
        staff = await call('POST','/admin/staff',ah,201,staff_data)
        assert staff['role'] == 'COLABORADOR'
        await call('POST','/admin/staff',ah,409,staff_data)
        login = await call('POST','/auth/login',{},200,{'email':staff_data['email'],'password':staff_data['password']})
        fh = {'Authorization':'Bearer '+login['access_token']}
        await call('PATCH',f'/admin/users/{user_id}',fh,403,{'is_active':False})
        await call('POST','/admin/staff',fh,403,staff_data)
        data = {'category_id':cat_id,'title':'Celular preto','description':'Celular preto com capa azul','location_name':'Biblioteca','event_date':datetime.now(timezone.utc).isoformat(),'type':'ENCONTRADO'}
        found = await call('POST','/items/found',fh,201,data)
        data['type']='PERDIDO'
        lost = await call('POST','/items/lost',uh,201,data)
        public = await call('GET','/admin/items?origin=user',fh)
        assert [x['id'] for x in public['items']] == [lost['id']]
        internal = await call('GET','/admin/items?origin=internal',ah)
        assert [x['id'] for x in internal['items']] == [found['id']]
        await call('POST',f"/admin/items/{found['id']}/matches/{lost['id']}/send",fh,201)
        await call('POST',f"/admin/items/{found['id']}/matches/{lost['id']}/send",fh,409)
        claims = await call('GET','/claims/my-claims',uh)
        claim = claims['items'][0]
        assert claim['status']=='CORRESPONDENCIA'
        contact = await call('GET',f"/messages/claims/{claim['id']}/contact",uh)
        assert contact['id']==staff['id']
        message_path=f"/messages/items/{found['id']}/messages"
        await call('POST',message_path,fh,201,{'receiver_id':str(user_id),'content':'Olá! Confira este objeto.'})
        await call('POST',message_path,uh,201,{'receiver_id':staff['id'],'content':'É meu, obrigado.'})
        await call('GET',message_path+f"?interlocutor_id={staff['id']}",sh,400)
        await call('POST',f"/claims/items/{found['id']}/claims",uh,201,{'proof_description':'Meu celular preto com capa azul'})
        await call('POST',f"/claims/items/{found['id']}/claims",uh,400,{'proof_description':'Duplicada'})
        all_claims=await call('GET','/admin/claims',fh)
        assert all_claims['total']==1
        await call('PATCH',f"/claims/claims/{claim['id']}/status",fh,200,{'status':'APROVADA'})
        pickup=(datetime.now(timezone.utc)+timedelta(days=1)).isoformat()
        await call('PATCH',f"/claims/claims/{claim['id']}/pickup",uh,403,{'pickup_at':pickup})
        await call('PATCH',f"/claims/claims/{claim['id']}/pickup",fh,200,{'pickup_at':pickup})
        await call('POST',f"/claims/claims/{claim['id']}/return",fh,200,{'signature':'data:image/png;base64,'+'A'*110})
        returned=await call('GET',f"/admin/items/{found['id']}",ah)
        assert returned['status']=='DEVOLVIDO'
        await call('POST',f"/claims/claims/{claim['id']}/return",fh,409,{'signature':'data:image/png;base64,'+'A'*110})
        await call('POST',f"/items/{found['id']}/reviews",uh,201,{'rating':5,'comment':'Recebido.'})
        reviews = await call('GET',f"/items/{found['id']}/reviews",uh)
        assert len(reviews)==1
        received = await call('GET',f"/users/{staff['id']}/reviews",fh)
        assert received['total_reviews']==1
        # Usuário inicia o contato sem correspondência enviada previamente.
        data['type']='ENCONTRADO'
        second = await call('POST','/items/found',fh,201,data)
        direct = await call('POST',f"/claims/items/{second['id']}/claims",uh,201,{'proof_description':'Reconheço meu celular'})
        contact = await call('GET',f"/messages/claims/{direct['id']}/contact",uh)
        assert contact['id']==staff['id']
        await call('POST',f"/messages/items/{second['id']}/messages",uh,201,{'receiver_id':staff['id'],'content':'Olá, gostaria de conferir.'})
        await call('POST',f"/messages/items/{second['id']}/messages",fh,201,{'receiver_id':str(user_id),'content':'Vamos conferir.'})
        await call('PATCH',f"/claims/claims/{direct['id']}/status",sh,403,{'status':'APROVADA'})
        await call('GET','/reports',uh,404)
        await call('GET','/admin/reports',ah,404)
    app.dependency_overrides.clear()
    await engine.dispose()
    print('\n'.join(checks)); print(f'PASS: {len(checks)} chamadas e verificações de estado')

if __name__=='__main__': asyncio.run(main())
