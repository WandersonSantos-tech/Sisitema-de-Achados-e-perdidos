"""Integração HTTP com banco isolado: autenticação, moderação e acompanhamento."""
import asyncio
from datetime import datetime, timezone
from uuid import UUID, uuid4
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.main import app
from app.api.deps import get_db
from app.models import Base, Category, Item, Report, User, StatusHistory
from app.models.enums import UserRole, ItemStatus, ItemType
from app.core.security import hash_password


def test_administrative_flows():
    asyncio.run(run_flows())

async def run_flows():
    engine = create_async_engine('sqlite+aiosqlite:///:memory:')
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async def db_override():
        async with session_factory() as db:
            yield db
    app.dependency_overrides[get_db] = db_override
    try:
        async with session_factory() as db:
            admin = User(id=uuid4(), name='Admin Teste', email='admin@example.com', password_hash=hash_password('Senha123!'), role=UserRole.ADMIN)
            author = User(id=uuid4(), name='Autor Teste', email='autor@example.com', password_hash=hash_password('Senha123!'))
            reporter = User(id=uuid4(), name='Denunciante Teste', email='reporter@example.com', password_hash=hash_password('Senha123!'))
            db.add_all([admin, author, reporter]); await db.commit()
            cat = Category(name='Documentos', description='Categoria original')
            db.add(cat); await db.commit()
            item = Item(id=uuid4(), user_id=author.id, category_id=cat.id, type=ItemType.PERDIDO, status=ItemStatus.PERDIDO, title='Carteira perdida', description='Carteira perdida na biblioteca', location_name='Biblioteca', event_date=datetime.now(timezone.utc), secret_details='SEGREDO')
            found = Item(id=uuid4(), user_id=admin.id, category_id=cat.id, type=ItemType.ENCONTRADO, status=ItemStatus.ENCONTRADO, title='Carteira encontrada', description='Objeto reservado na biblioteca', location_name='Biblioteca', event_date=datetime.now(timezone.utc), secret_details='SEGREDO ENCONTRADO')
            db.add_all([item, found]); await db.commit()
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
            async def req(method, url, expected=200, token=None, **kw):
                response = await client.request(method, '/api/v1'+url, headers={'Authorization':f'Bearer {token}'} if token else {}, **kw)
                assert response.status_code == expected, (url, response.status_code, response.text)
                return response.json() if response.content else None
            async def login(email):
                return (await req('POST','/auth/login',json={'email':email,'password':'Senha123!'}))['access_token']
            at = await login(admin.email); rt = await login(reporter.email); ut = await login(author.email)
            await req('GET','/admin/stats',401)
            await req('GET','/admin/users',403,rt)
            targets = await req('GET','/reports/targets',token=rt)
            assert targets['total']==1 and 'SEGREDO' not in str(targets)
            await req('POST','/reports',422,rt,json={'reason':'Motivo suficientemente longo'})
            report = await req('POST','/reports',201,rt,json={'reason':'Informação incorreta nesta publicação','reported_item_id':str(item.id)})
            await req('POST','/reports',400,rt,json={'reason':'Informação incorreta nesta publicação','reported_item_id':str(item.id)})
            rid = report['id']
            await req('GET',f'/reports/{rid}',403,ut)
            await req('GET',f'/reports/{uuid4()}',404,rt)
            assert (await req('GET','/reports',token=rt))['total']==1
            detail=await req('GET',f'/admin/reports/{rid}',token=at)
            assert detail['reported_item']['title']==item.title and detail['reporter']['name']==reporter.name
            await req('PATCH',f'/admin/reports/{rid}/decision',422,at,json={'action':'INVALIDA','notes':'Parecer adequado para teste'})
            await req('PATCH',f'/admin/reports/{rid}/decision',token=at,json={'action':'REMOVER_PUBLICACAO','notes':'Publicação contém informação incorreta.'})
            await req('PATCH',f'/admin/reports/{rid}/decision',409,at,json={'action':'ARQUIVAR','notes':'Segundo parecer nao permitido'})
            assert (await req('GET',f'/admin/items/{item.id}',token=at))['status']=='CANCELADO'
            assert (await req('GET','/reports/targets',token=rt))['total']==0
            assert (await req('GET',f'/reports/{rid}',token=rt))['resolution_action']=='REMOVER_PUBLICACAO'
            # User-only reports, blocking and previously issued tokens.
            report2=await req('POST','/reports',201,rt,json={'reason':'Conduta inadequada deste usuário','reported_user_id':str(author.id)})
            await req('PATCH',f"/admin/reports/{report2['id']}/decision",token=at,json={'action':'BLOQUEAR_USUARIO','notes':'Conduta indevida confirmada na análise.'})
            await req('GET','/auth/me',401,ut)
            await req('POST','/auth/login',401,json={'email':author.email,'password':'Senha123!'})
            await req('PATCH',f'/admin/users/{admin.id}',400,at,json={'is_active':False})
            await req('PATCH',f'/admin/users/{author.id}',token=at,json={'is_active':True})
            await req('GET','/auth/me',token=ut)
            report3=await req('POST','/reports',201,rt,json={'reason':'Solicito uma análise sem remover','reported_user_id':str(author.id)})
            await req('PATCH',f"/admin/reports/{report3['id']}/decision",token=at,json={'action':'ARQUIVAR','notes':'Não foram encontradas irregularidades.'})
            assert (await req('GET','/admin/reports?resolved=false',token=at))['total']==0
            await req('POST','/reports',400,rt,json={'reason':'Tentativa de denúncia de si próprio','reported_user_id':str(reporter.id)})
            await req('POST','/reports',400,rt,json={'reason':'Tentativa de denunciar alvo inexistente','reported_item_id':str(uuid4())})
            # Categories: real writes, validation and protection of linked records.
            await req('POST','/admin/categories',422,at,json={'name':'   '})
            newcat=await req('POST','/admin/categories',201,at,json={'name':'Chaves','description':'Nova categoria'})
            await req('POST','/admin/categories',409,at,json={'name':'Chaves'})
            await req('PATCH',f"/admin/categories/{newcat['id']}",token=at,json={'name':'Chaves e chaveiros'})
            await req('PATCH',f"/admin/categories/{newcat['id']}",422,at,json={'name':None})
            await req('DELETE',f'/admin/categories/{cat.id}',409,at)
            await req('DELETE',f"/admin/categories/{newcat['id']}",204,at)
            assert (await req('GET','/admin/items?status_filter=CANCELADO',token=at))['total']==1
            stats=await req('GET','/admin/stats',token=at)
            assert stats['removed_items']==1 and stats['pending_reports']==0 and stats['resolved_reports']==3
            assert (await req('GET','/admin/users?page=2&page_size=2',token=at))['total']==3
            # Pending requests must not reactivate a moderated item.
            claim = await req('POST', f'/claims/items/{found.id}/claims', 201, rt,
                json={'proof_description': 'Reconheço características da carteira encontrada.'})
            # Removal outside a report also leaves history.
            await req('POST',f'/admin/items/{found.id}/remove',token=at,json={'reason':'Publicação duplicada cadastrada por engano.'})
            await req('PATCH',f"/claims/claims/{claim['id']}/status",400,at,json={'status':'APROVADA'})
        async with session_factory() as db:
            assert len((await db.scalars(select(StatusHistory))).all())==2
            assert (await db.get(Item,item.id)) is not None
            assert (await db.get(Report, UUID(rid))).resolution_notes
        print('PASS: authenticated API, persisted reports and decisions, block/unblock, removal history, categories, filters, statistics, authorization and validation.')
    finally:
        app.dependency_overrides.clear()
        await engine.dispose()
