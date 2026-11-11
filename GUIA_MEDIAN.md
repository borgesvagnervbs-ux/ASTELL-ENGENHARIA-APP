# Astell Home → APK com o Median.co

O Median transforma um **site publicado (https)** em aplicativo. Por isso o primeiro passo é colocar os arquivos no ar.

## 1. Publicar os arquivos
Envie toda a pasta (index.html, admin.html, app.js, admin.js, style.css, admin.css, config.js, manifest.webmanifest, pasta img/) para uma hospedagem estática com https, por exemplo Netlify, Vercel, Cloudflare Pages ou GitHub Pages.
- Confirme que `config.js` está com `SUPABASE_URL` e `SUPABASE_KEY` (chave anon) preenchidos.
- O app do cliente fica em `https://SEU-SITE/index.html`. O painel admin continua em `/admin.html` (use pelo navegador, não coloque no aplicativo).

## 2. Supabase (Authentication > URL Configuration)
- **Site URL**: `https://SEU-SITE/index.html`
- **Redirect URLs**: adicione `https://SEU-SITE/index.html` (confirmação de e-mail e recuperação de senha voltam para ele).

## 3. No Median
1. **App URL**: `https://SEU-SITE/index.html`
2. **Nome**: Astell Home · **Ícone**: `img/icon-512.png` · **Splash/cores**: fundo e barra de status `#0b1623`.
3. **Navegação**: marque como links internos o domínio do seu site e `*.supabase.co`. Deixe abrir fora do app (navegador/WhatsApp) os links `wa.me` e `tel:`.
4. **Permissões** (para anexar fotos, vídeos e PDFs): ative acesso a Câmera e Arquivos/Fotos. Se o enviar PDF/arquivo não abrir, ative o "file upload" nas configurações do Median.
5. Desative o "pull to refresh" se atrapalhar a rolagem. Mantenha a rotação em retrato.
6. Gere o **APK** (teste direto no celular) ou o **AAB** (para a Play Store).

## 4. Login por CPF, primeiro acesso com e-mail (v23 + v25)
**Como funciona**
- **Primeiro acesso:** o cliente informa CPF, e-mail e senha. O CPF e o e-mail precisam ser os do proprietário cadastrado no painel (campo e-mail do proprietário). O Supabase envia um link de confirmação para esse e-mail.
- **Entrar:** CPF + senha (com o ícone de olho para conferir). "Esqueci minha senha" envia o link de nova senha para o e-mail cadastrado.
- **E-mail que já tem acesso (ex.: já entrou com o Google):** no primeiro acesso o app envia um link para esse e-mail; ao abrir o link o cliente informa o CPF e cria a senha, e depois entra com CPF e senha.
- **CPF sem residência:** aparece "Contate a ASTELL" (WhatsApp).

**Passo a passo**
1. **SQL Editor:** rode, nesta ordem, `schema_v23.sql`, `schema_v24.sql` (se ainda não rodou), `schema_v25.sql` e `schema_v26.sql`.
2. **Authentication > Users:** apague as contas de teste criadas antes da v25 (as que têm e-mail terminado em `@cpf.astellhome.app`).
3. **Authentication > Providers > Email:** mantenha "Confirm email" LIGADO.
4. **Authentication > Emails > SMTP Settings:** configure um SMTP próprio (Gmail com senha de app, Resend, Brevo etc.). O envio padrão do Supabase só entrega poucos e-mails por hora e, em muitos casos, só para membros da equipe; sem isso o e-mail de confirmação pode não chegar.
5. **Authentication > URL Configuration:** Site URL e Redirect URLs com o endereço do app (e do painel), como já está.
6. **Superusuários:** cadastre os e-mails deles: `insert into super_emails(email) values ('seu.email@gmail.com') on conflict do nothing;`. Depois eles fazem o "Primeiro acesso" com o CPF e esse e-mail (CPF e e-mail precisam estar nas duas listas).
7. **Painel por CPF (opcional):** `insert into staff_cpfs(cpf_hash,email) values (cpf_hash('NUMEROSDOCPF'),'email@gmail.com') on conflict do nothing;` e a pessoa faz o "Primeiro acesso" no painel. O Google continua funcionando no painel.
8. **Clientes antigos (e-mail ou Google):** use "Liberar" no CPF dele no painel e peça o "Primeiro acesso" no app.

## 5. Observações
- Depois de qualquer mudança nos arquivos, republique o site: o aplicativo carrega sempre a versão publicada, sem gerar novo APK.
- Cloudinary não precisa de mudança.

## 6. Login com Google no APK
**Como funciona:** o botão "Entrar com o Google" abre a escolha de contas do Android (plugin nativo do Median). Na primeira vez o app pede o CPF para ligar a conta Google à residência cadastrada pelo painel.

1. **Google Cloud Console** (console.cloud.google.com) > APIs e serviços > Credenciais:
   - Tela de consentimento OAuth configurada (tipo Externo, nome do app, e-mail de suporte).
   - **ID do cliente "Aplicativo da Web"**: já é o usado no Supabase. Anote o Client ID e o Client Secret.
   - **ID do cliente "Android"**: nome do pacote = o do app no Median; SHA-1 = o do certificado de assinatura (o Median informa; o APK de teste e o da Play Store podem ter SHA-1 diferentes, crie um cliente Android para cada).
2. **Supabase > Authentication > Providers > Google:** ative, cole Client ID e Secret do cliente Web; em "Authorized Client IDs" coloque o Client ID Web (e o Android, se pedir); ligue **Skip nonce checks**.
3. **Median App Studio > Native Plugins > Social Login > Settings:** informe o Web Client ID, salve e **gere o APK novamente**.
4. **SQL Editor:** rode `schema_v24.sql`. Para superusuário entrar pelo Google, cadastre o Gmail dele na lista `super_emails` (linha comentada no arquivo).
5. Instale o novo APK e teste: Entrar com o Google > escolher a conta > informar o CPF.

Se aparecer "No credentials available", quase sempre o SHA-1 ou o nome do pacote do cliente Android estão errados.
