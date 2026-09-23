# FaceAuth

Sistema de controle de acesso por reconhecimento facial.

O projeto tem um backend em Python (FastAPI) que gera e compara embeddings faciais, e um frontend em React que funciona como totem de entrada e como painel administrativo. Tudo roda em containers Docker.

## Funcionalidades

- **Totem de acesso:** captura um quadro da câmera a cada segundo, envia para a API e mostra "Liberado" (com nome e matrícula) ou "Negado".
- **Cadastro:** nome, matrícula e foto tirada na hora pela câmera da entrada.
- **Gestão de usuários:** listar, editar dados, trocar a foto e remover.
- **Gestão de administradores:** criar, editar e remover contas, com proteção para nunca remover o último admin.
- **Login de administrador** com JWT. Só o painel exige login; a verificação facial é pública, porque o rosto é a própria credencial.
- **Câmera via celular:** usa o app IP Webcam (Android) como câmera fixa, pela rede Wi-Fi.
- **Orientação automática:** o sistema testa as quatro rotações do quadro, então o celular pode ficar em pé ou deitado.

## Como o reconhecimento funciona

1. O navegador busca uma foto em `/shot.jpg` no IP Webcam e envia para `POST /auth/verify`.
2. A API corrige a orientação do quadro: um detector de rostos do OpenCV (SSD com ResNet-10) é testado nas rotações de 0, 90, 180 e 270 graus, e vale a de maior confiança.
3. A imagem é reduzida para no máximo 400 px no lado maior, o que derrubou o tempo de processamento de vários segundos para cerca de meio segundo.
4. O DeepFace detecta o rosto com MTCNN e gera o embedding com o modelo VGG-Face.
5. O embedding é comparado com todos os usuários cadastrados por distância de cosseno. Se a menor distância for menor ou igual a `0.40`, o acesso é liberado.

A comparação usa uma matriz NumPy normalizada mantida em memória (um produto matricial só, sem laço em Python). Esse cache é renovado a cada 30 segundos e imediatamente após qualquer cadastro, edição ou remoção de usuário.

No frontend, o totem só mostra "Negado" depois de 3 leituras seguidas sem reconhecimento, para que um único quadro ruim (ângulo ou desfoque) não gere um falso negativo.

## Stack

**Backend**
- Python 3.11, FastAPI e Uvicorn
- MongoDB com Motor (driver assíncrono)
- DeepFace (VGG-Face + MTCNN), OpenCV e NumPy
- python-jose (JWT) e `hashlib` (PBKDF2 para senhas)

**Frontend**
- React 19, TanStack Start e TanStack Router, TanStack Query
- Vite, Tailwind CSS v4 e componentes shadcn/ui
- Bun como gerenciador de pacotes

**Infraestrutura**
- Docker e Docker Compose (MongoDB, backend e frontend)

## Arquitetura do backend

O backend é dividido em camadas, e cada camada só conversa com a de baixo:

```
api (rotas, schemas, dependências)
  -> controller (traduz erros de negócio em respostas HTTP)
    -> core (serviços e regras: reconhecimento, usuários, admins, segurança)
      -> database (conexão, models, repository)
```

```
FaceAuth/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── src/
│       ├── main.py
│       ├── api/          # routes/, schemas/, dependencies.py
│       ├── controller/   # user, admin e auth controllers
│       ├── core/         # face_recognition, face_orientation, user_cache,
│       │                 # user_service, admin_service, security, camera,
│       │                 # recognition_loop e models/ (detector de rostos)
│       ├── database/     # connection, models, repository
│       └── utils/        # image_utils e scripts de teste
└── frontend/
    ├── Dockerfile
    └── src/
        ├── routes/       # index, login, alunos, alunos.novo, admins, camera
        ├── components/   # camera-view e componentes de UI
        └── lib/          # api, auth e camera
```

Na inicialização, o servidor espera o MongoDB responder (tentando de novo a cada 2 segundos) e aquece os modelos de reconhecimento antes de aceitar requisições. Assim a primeira verificação real não paga o custo de carregar os modelos.

## Como rodar

O projeto inteiro (MongoDB, backend e frontend) sobe pelo Docker.

### Pré-requisitos

- Docker e Docker Compose
- Um celular Android com o app **IP Webcam**, na mesma rede Wi-Fi do computador

### 1. Configurar as variáveis de ambiente

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edite os dois arquivos (veja a tabela de variáveis abaixo). Como o backend roda dentro de um container, o host do MongoDB no `MONGO_URI` deve ser o nome do container do banco, e não `localhost`:

```
MONGO_URI=mongodb://usuario:senha@mongo:27017/faceauth?authSource=admin
```

### 2. Subir tudo

Na raiz do projeto:

```bash
docker compose up --build
```

O primeiro build demora vários minutos, porque compila o `dlib` e instala o TensorFlow. Os próximos usam o cache do Docker. Na primeira execução o DeepFace também baixa os pesos do modelo VGG-Face (algumas centenas de MB), então a inicialização do backend demora mais.

Depois disso:

- API em `http://localhost:8000`
- Documentação interativa (Swagger) em `http://localhost:8000/docs`
- Frontend na porta configurada no `docker-compose.yml`

Para parar, use `Ctrl+C` ou, em outro terminal, `docker compose down`.

### 3. Primeiro administrador

Com o sistema vazio, ainda não existe ninguém para fazer login. O primeiro admin é criado com a chave de instalação definida em `ADMIN_SETUP_KEY`:

```bash
curl -X POST http://localhost:8000/admins \
  -H 'Content-Type: application/json' \
  -H 'X-Setup-Key: SUA_CHAVE_DE_INSTALACAO' \
  -d '{"username": "admin", "password": "sua-senha-forte"}'
```

Também dá para fazer isso pela tela `/admins` do frontend, sem estar logado. Os próximos admins são criados por um admin já autenticado.

### 4. Câmera

1. Abra o **IP Webcam** no celular e inicie o servidor.
2. Copie o endereço que o app mostra (por exemplo `http://192.168.0.10:8080`).
3. No frontend, abra a tela **Câmera**, cole o endereço, salve e use "Testar foto".

O navegador busca a foto direto do celular, então o Docker não interfere nessa etapa. O endereço fica salvo no navegador (`localStorage`). O valor padrão vem de `VITE_CAMERA_URL`.

### Loop de reconhecimento pelo terminal (opcional)

Existe também um modo sem frontend, que lê o stream da câmera direto no backend e imprime o resultado no terminal. Ele usa a variável `CAMERA_URL`. Com os containers no ar:

```bash
docker compose exec NOME_DO_SERVICO_DO_BACKEND python -m core.recognition_loop
```

### Rodando sem Docker (opcional)

Só é necessário se você quiser desenvolver sem containers. Requer Python 3.11, Bun e as ferramentas de compilação do `dlib` (no Ubuntu/WSL2: `sudo apt install build-essential cmake`). O MongoDB continua vindo do Docker (`docker compose up -d` sobe o serviço do banco).

```bash
# backend
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd src
uvicorn main:app --reload
```

O projeto usa imports sem o prefixo `src.` (por exemplo `from core.camera import ...`), então o servidor precisa ser iniciado de dentro de `backend/src`. Nesse modo, o `MONGO_URI` aponta para `localhost`.

```bash
# frontend
cd frontend
bun install
bun run dev
```

## Variáveis de ambiente

**Backend (`backend/.env`)**

| Variável | Para que serve |
| --- | --- |
| `MONGO_URI` | String de conexão do MongoDB, com o nome do banco no caminho (ex.: `mongodb://usuario:senha@faceauth_mongo:27017/faceauth?authSource=admin`) |
| `MONGO_ROOT_USER`, `MONGO_ROOT_PASSWORD` | Credenciais do MongoDB usadas pelo Docker Compose |
| `JWT_SECRET_KEY` | Chave de assinatura dos tokens. Gere uma com `python -c 'import secrets; print(secrets.token_hex(32))'` |
| `JWT_ALGORITHM` | Algoritmo do JWT (padrão `HS256`) |
| `JWT_EXPIRE_MINUTES` | Validade do token em minutos (padrão `60`) |
| `ADMIN_SETUP_KEY` | Chave para criar o primeiro administrador |
| `CAMERA_URL` | Stream da câmera, usado só pelo `recognition_loop` |

**Frontend (`frontend/.env`)**

| Variável | Para que serve |
| --- | --- |
| `VITE_API_URL` | Endereço da API, acessado pelo navegador (padrão `http://localhost:8000`) |
| `VITE_CAMERA_URL` | Endereço padrão do IP Webcam |

## API

Rotas marcadas com "JWT" exigem o header `Authorization: Bearer <token>`.

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/health` | público | Verificação de saúde |
| POST | `/auth/verify` | público | Recebe uma foto (`multipart`, campo `photo`) e responde se o acesso foi liberado |
| POST | `/auth/admin/login` | público | Login de administrador, retorna o JWT |
| POST | `/users` | JWT | Cadastra usuário (`name`, `document`, `photo`) |
| GET | `/users` | JWT | Lista usuários |
| GET, PATCH, DELETE | `/users/{id}` | JWT | Busca, atualiza (nome, documento e foto opcionais) ou remove por id |
| GET, PATCH, DELETE | `/users/document/{document}` | JWT | Mesmas operações, usando a matrícula |
| POST | `/admins` | `X-Setup-Key` ou JWT | Cria administrador |
| GET | `/admins` | JWT | Lista administradores |
| GET, PATCH, DELETE | `/admins/{id}` | JWT | Busca, atualiza (usuário e senha) ou remove |

Exemplo de resposta de `POST /auth/verify`:

```json
{
  "access_granted": true,
  "face_detected": true,
  "user": { "id": "...", "name": "Maria", "document": "123456", "created_at": "..." },
  "distance": 0.07
}
```

## Segurança

- Senhas de administradores são guardadas com **PBKDF2-HMAC-SHA256** (260.000 iterações, salt aleatório de 16 bytes por senha) e verificadas com comparação em tempo constante. O texto puro nunca é salvo nem retornado.
- Tokens JWT expiram (60 minutos por padrão). No frontend, o token fica em `sessionStorage`: sobrevive ao recarregamento da página e some quando a aba é fechada. O app desloga sozinho quando o token expira.
- Todas as rotas de gestão exigem JWT. Só `/auth/verify`, `/auth/admin/login` e `/health` são públicas.
- O `.env` fica fora do repositório (`.gitignore`) e das imagens Docker (`.dockerignore`).

## Limitações conhecidas

Este é um projeto de estudo e ainda não está pronto para produção. Pontos que eu trataria antes disso:

- **Sem prova de vida (liveness):** uma foto impressa ou na tela de outro celular pode enganar o reconhecimento.
- **CORS aberto (`*`)**, útil no desenvolvimento, mas que deve ser restrito às origens do frontend.
- **Sem limite de tentativas** no login de administrador.
- **Sem validação de força de senha** ao criar ou editar administradores.
- **Dados biométricos sem proteção adicional:** os embeddings e as matrículas ficam em texto no MongoDB. Em um cenário real, é preciso considerar a LGPD para dados biométricos.
- **Câmera via HTTP:** o navegador busca a foto direto do celular, então o frontend e o IP Webcam precisam estar na mesma rede, e um frontend servido em HTTPS seria bloqueado por conteúdo misto.

## Próximos passos

- Prova de vida para impedir fraude com foto
- Rate limiting e política de senha
- Paginação na listagem de usuários
- Registro de entradas (histórico de acessos)
- Testes automatizados para os serviços do `core/`