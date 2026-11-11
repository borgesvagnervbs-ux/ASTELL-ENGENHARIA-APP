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

## 4. Login por CPF + senha (v23)
1. **Supabase > Authentication > Providers > Email:** DESLIGUE "Confirm email". O login por CPF usa um e-mail interno (`CPF@cpf.astellhome.app`) que não recebe mensagens.
2. **SQL Editor:** rode `schema_v23.sql` (uma vez). Ele cria o acesso por CPF, os superusuários (91350735000 e 91311764020 veem todas as residências) e a lista de CPFs do painel.
3. **Crie logo as contas dos dois superusuários** (tela "Primeiro acesso", com o CPF de cada um) antes de divulgar o aplicativo. Quem criar a senha de um CPF primeiro fica com ele.
4. **Painel admin por CPF (opcional):** para liberar um CPF no painel, rode no SQL Editor `insert into staff_cpfs(cpf_hash) values (cpf_hash('NUMEROSDOCPF')) on conflict do nothing;` e peça à pessoa para entrar no painel (Primeiro acesso). O Google continua funcionando no painel para as contas administradoras atuais.
5. **Clientes que já tinham conta por e-mail/Google:** no painel, libere o CPF dele (Proprietários > liberar CPF) e peça que use "Primeiro acesso" no app. A conta antiga fica sem vínculo.
6. **Esqueci a senha:** não há e-mail de recuperação. O app mostra "Contate a ASTELL"; para redefinir, use Supabase > Authentication > Users > (usuário) > Reset password/Delete user e peça um novo "Primeiro acesso".

## 5. Observações
- O login com Google do aplicativo foi retirado (a identificação agora é o CPF). O plugin Social Login do Median não é mais necessário.
- Depois de qualquer mudança nos arquivos, republique o site: o aplicativo carrega sempre a versão publicada, sem gerar novo APK.
- Cloudinary não precisa de mudança.
