# Comparação web → mobile

Fontes consultadas: rotas e páginas do frontend, serviços HTTP, schemas e permissões do backend, e Swagger publicado em 07/11/2026. “Validada” na tabela se refere somente à evidência indicada. Testes com mocks não equivalem a um teste em aparelho conectado à produção.

| Funcionalidade do usuário na web | Equivalente mobile | Estado e evidência |
| --- | --- | --- |
| Login por e-mail/senha | LoginScreen + AuthContext | Implementada, aguardando teste manual; teste de tela verifica chamada ao contexto |
| Mostrar/ocultar senha | Controle no login | Implementada, aguardando teste manual |
| Cadastro com CPF, nome, e-mail, telefone e senha | CadastroScreen | Implementada, aguardando teste manual; payload e telefone opcional testados com mock |
| CPF obrigatório, máscara e dígitos verificadores | validation.js e formulário | Implementada e validada em testes automatizados |
| CPF/e-mail já registrados | Mensagem HTTP da API | Implementada, aguardando teste manual; CPF duplicado coberto com resposta simulada |
| Confirmação e mínimo de 8 caracteres da senha | Cadastro e redefinição | Implementada, aguardando teste manual; limite conferido no Swagger |
| Recuperação por e-mail | RecuperarSenhaScreen | Implementada, aguardando teste manual de entrega de e-mail |
| Redefinição com token | RedefinirSenhaScreen | Implementada, aguardando teste manual; código pode ser copiado do link web recebido |
| Sessão persistente e logout | SecureStore + AuthProvider | Implementada, aguardando teste manual de armazenamento nativo; restauração/logout validados com mocks |
| Restrição a USER e proteção de rotas | Grupos de navegação condicionais | Implementada e validada em testes de navegação/papéis com mocks |
| Erros HTTP, validação, rede, timeout e sessão expirada | Cliente HTTP compartilhado | Implementada e validada em testes com respostas simuladas |
| Início, indicadores de atividade e menu | UsuarioHomeScreen preservada e integrada | Implementada, aguardando teste manual e comparação visual |
| Listagem de todos os itens próprios | MeusItensScreen + leitura de todas as páginas | Implementada, aguardando teste manual; paginação validada com mock |
| Pesquisa e filtros | Texto, categoria e status | Implementada, aguardando teste manual |
| Cadastro de objeto perdido | RegistrarItemScreen | Implementada, aguardando teste manual; preenchimento e payload validados em renderização com mocks |
| Categorias reais, local, data/hora, medidas e detalhes protegidos | Formulário e categories | Implementada, aguardando teste manual; medidas/data e campos obrigatórios cobertos por testes |
| Até 3 fotos, seleção, prévia e remoção antes de enviar | ImagePicker e ImageManipulator | Implementada, aguardando teste manual de permissões e mídia |
| Upload multipart e recuperação após falha de fotos | Serviços + objeto salvo + tela de detalhes | Implementada, aguardando teste manual; cabeçalho multipart validado com mock |
| Detalhes, fotos, descrição, status e dados protegidos do próprio registro | ItemDetalheScreen e galeria | Implementada, aguardando teste manual |
| Edição do objeto | Formulário compartilhado em modo de edição | Implementada, aguardando teste manual |
| Exclusão confirmada do objeto | Confirmação nativa e DELETE | Implementada, aguardando teste manual; cliente aceita resposta 204 em teste |
| Bloqueios após correspondência/solicitação | Bloqueio por matches e validação final 409 da API | Implementada, aguardando teste manual; permissões preservadas no servidor |
| Correspondências automáticas encaminhadas | CorrespondenciasScreen, score e seleção | Implementada, aguardando teste manual; algoritmo permanece no backend |
| Correspondências manuais encaminhadas | Identificação is_manual | Implementada, aguardando teste manual; envio é realizado pela equipe web |
| Detalhes protegidos da correspondência | Dados retornados por /matches | Implementada, aguardando teste manual; API retorna textos protegidos em vez dos dados privados do encontrado |
| Criação de solicitação/comprovação | Modal ligado a /claims/items/{id}/claims | Implementada, aguardando teste manual |
| Acompanhamento de solicitações e status | SolicitacoesScreen paginada | Implementada, aguardando teste manual |
| Lista/abertura de conversas | Cada solicitação elegível abre ChatScreen | Implementada, aguardando teste manual |
| Histórico, envio e atualização de mensagens | ChatScreen, polling de 3 segundos e atualização manual | Implementada, aguardando teste manual; envio, contato e limpeza do polling testados com mocks |
| Negociação após primeira mensagem | Serviço de mensagens real | Implementada, aguardando teste manual das transições no backend |
| Agendamento e conclusão da devolução, pelo usuário | Datas, status e conversa nas solicitações | Implementada, aguardando teste manual com a equipe |
| Avaliar devolução e consultar avaliações | ReviewForm após returned_at | Implementada, aguardando teste manual; campos e rotas conferidos no contrato |
| Notificações, leitura e abertura | NotificacoesScreen paginada | Implementada, aguardando teste manual |
| Dados da conta, avaliações recebidas e recuperação | PerfilScreen | Implementada, aguardando teste manual |
| Central de ajuda e links | AjudaScreen | Implementada, aguardando teste manual |
| URL Azure e contratos existentes | api.js + serviços | Implementada e validada quanto à configuração, rotas no Swagger e conectividade pública; operações autenticadas aguardam teste manual |
| Interface em diferentes telas, notch, teclado e modais | Áreas seguras, rolagem, KeyboardAvoidingView, galeria/modal e largura máxima | Implementada, aguardando teste manual e comparação lado a lado; identidade visual preservada, equivalência exata não certificada |

## Recursos que não pertencem ao usuário comum

| Recurso mencionado no pedido | Regra real | Tratamento |
| --- | --- | --- |
| Cadastrar objeto encontrado | /items/found exige get_current_staff | Não exposto no mobile USER; não é uma funcionalidade faltante desse perfil |
| Enviar correspondência manual a outro usuário | Rotas /admin exigem funcionário | Mobile recebe e acompanha o encaminhamento |
| Agendar retirada, iniciar negociação como funcionário e registrar assinatura/devolução | Rotas /pickup, /start-negotiation e /return exigem get_current_staff | Mobile acompanha o estado; execução permanece no web da equipe |
| 2FA no momento da retirada | Não há contrato de 2FA do usuário no backend fornecido | Bloqueada por dependência externa se vier a ser exigida; não simulada nem apresentada como implementada |
| Abrir automaticamente o link web de recuperação dentro do aplicativo | Backend gera URL web e não há associação de domínio mobile | Código pode ser copiado para o app ou o fluxo pode ser concluído na web; link universal não implementado |

Nenhuma funcionalidade autenticada foi declarada validada de ponta a ponta em produção. A entrega contém implementação e verificações locais; a aceitação final depende do roteiro em VALIDACAO.md.
