# 🚀 Instruções para Hospedar no GitHub Pages

## 📋 Arquivos para Upload

Você precisa fazer upload destes 3 arquivos principais:

1. **Script_Atendimento_Fibramar.html** - Arquivo principal
2. **script-data.json** - Dados do sistema
3. **config.js** - Configurações

## 🔧 Passo a Passo Detalhado

### 1. Acesse seu repositório no GitHub
- URL será algo como: `https://github.com/SEU-USUARIO/script-atendimento-fibramar`

### 2. Fazer Upload dos Arquivos

#### Método 1: Interface Web (Mais Fácil)
1. Clique em **"Add file"** → **"Upload files"**
2. Arraste os 3 arquivos para a área de upload
3. Adicione mensagem: `"Adicionando sistema de atendimento"`
4. Clique **"Commit changes"**

#### Método 2: Criar Arquivo por Arquivo
1. Clique **"Add file"** → **"Create new file"**
2. Digite o nome: `Script_Atendimento_Fibramar.html`
3. Copie e cole o conteúdo do arquivo
4. Clique **"Commit changes"**
5. Repita para os outros arquivos

### 3. Ativar GitHub Pages
1. Vá para **"Settings"** (aba no topo do repositório)
2. Role para baixo até **"Pages"** (menu lateral esquerdo)
3. Em **"Source"**, selecione **"Deploy from a branch"**
4. Em **"Branch"**, selecione **"main"**
5. Deixe **"/ (root)"** selecionado
6. Clique **"Save"**

### 4. Aguardar Deploy
- GitHub levará 1-5 minutos para processar
- Você verá uma mensagem verde quando estiver pronto
- URL será: `https://SEU-USUARIO.github.io/script-atendimento-fibramar/`

## 🔗 URLs Finais

Após o deploy, suas URLs serão:
- **Sistema**: `https://SEU-USUARIO.github.io/script-atendimento-fibramar/Script_Atendimento_Fibramar.html`
- **Dados**: `https://SEU-USUARIO.github.io/script-atendimento-fibramar/script-data.json`
- **Config**: `https://SEU-USUARIO.github.io/script-atendimento-fibramar/config.js`

## ⚙️ Configurar URLs no Sistema

Depois do deploy, edite o arquivo `config.js` no GitHub:
1. Clique no arquivo `config.js`
2. Clique no ícone de lápis (editar)
3. Substitua as URLs pelos links do seu repositório
4. Commit as mudanças

## 🔄 Como Fazer Atualizações

Para atualizar o sistema:
1. Edite o arquivo `script-data.json` no GitHub
2. Aumente a versão (ex: "2.1.0" → "2.2.0")
3. Adicione/edite mensagens
4. Commit as mudanças
5. Todos os usuários recebem automaticamente!

## 📱 Distribuir para Equipe

Envie apenas este link para sua equipe:
`https://SEU-USUARIO.github.io/script-atendimento-fibramar/Script_Atendimento_Fibramar.html`

## ✅ Checklist Final

- [ ] Repositório criado no GitHub
- [ ] 3 arquivos principais enviados
- [ ] GitHub Pages ativado
- [ ] URLs configuradas no config.js
- [ ] Sistema testado
- [ ] Link distribuído para equipe

## 🆘 Problemas Comuns

**Erro 404**: Aguarde alguns minutos, o deploy pode demorar
**Não atualiza**: Limpe cache do navegador (Ctrl+F5)
**Não funciona**: Verifique se o repositório é público