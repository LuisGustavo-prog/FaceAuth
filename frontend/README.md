# FaceAuth Academia (frontend)

Frontend em React (Vite) para o FaceAuth. Duas telas publicas (Acesso e login admin) mais uma protegida (Cadastro).

## Como rodar

```bash
npm install
cp .env.example .env   # ajuste VITE_API_URL se a API nao estiver em localhost:8000
npm run dev
```

A API (`uvicorn`, rodando dentro de `src/`) precisa estar de pe, com CORS liberado (ja esta, em `main.py`).

## Camera (IP Webcam)

O app nao usa a camera do navegador. Ele le o stream do app **IP Webcam** direto do celular:

1. Abra o IP Webcam no celular e inicie o servidor. Anote o endereco mostrado (ex.: `http://192.168.0.10:8080`).
2. Copie esse mesmo endereco para `VITE_CAMERA_URL` no `.env` do frontend (o mesmo valor do `CAMERA_URL` do backend). Ele vira o valor inicial do campo "Endereco do IP Webcam" nas telas, sem precisar digitar toda vez. Da pra trocar na hora pela propria tela tambem; o que for digitado ali fica salvo no navegador e passa a valer.
3. O preview usa `${endereco}/video` (stream MJPEG). A captura de foto usa `${endereco}/shot.jpg`, que traz um JPEG isolado, sem depender de canvas.

Se a captura falhar com um erro de rede, confira:
- celular e computador na mesma rede Wi-Fi;
- endereco/porta corretos (a porta padrao do IP Webcam e 8080);
- se o navegador bloquear por CORS, sera necessario um proxy (a captura direta funciona na maioria das versoes atuais do app, mas isso depende de como cada versao configura os headers do servidor embutido).

## Telas

- **Acesso**: publica, sem login. Botao de verificacao manual e um modo de verificacao automatica (a cada 3s) chamando `POST /auth/verify`.
- **Cadastro**: exige login admin. Cadastra nome, matricula e foto via `POST /users`.
- **Admin**: login (`POST /auth/admin/login`); o token fica em memoria (estado do React), some ao recarregar a pagina.

## Limitacoes conhecidas

- Nao ha telas de listagem/edicao/remocao de alunos ainda (a API ja suporta, so falta a UI).
- Sem paginacao no consumo de `GET /users` (a propria API ainda nao pagina essa rota).
