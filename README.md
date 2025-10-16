# 📞 Script de Atendimento Fibramar

Sistema moderno de atendimento ao cliente com atualizações automáticas e interface responsiva.

## 🚀 **Para Administradores - Como Compartilhar**

### **Passo 1: Escolha uma Hospedagem**

#### **🌐 GitHub Pages (Recomendado - GRATUITO)**
1. Crie uma conta no [GitHub](https://github.com)
2. Crie um novo repositório público
3. Faça upload dos arquivos:
   - `Script_Atendimento_Fibramar.html`
   - `script-data.json`
   - `config.js`
4. Vá em Settings → Pages → Source: Deploy from branch → main
5. Sua URL será: `https://seuusuario.github.io/nome-do-repo/`

#### **☁️ Netlify (Alternativa - GRATUITO)**
1. Acesse [netlify.com](https://netlify.com)
2. Arraste a pasta com os 3 arquivos
3. URL automática será gerada

#### **📁 Google Drive (Simples)**
1. Faça upload dos arquivos para o Google Drive
2. Torne cada arquivo público (Compartilhar → Qualquer pessoa com o link)
3. Use os links diretos nos arquivos

### **Passo 2: Configure as URLs no config.js**

Edite o arquivo `config.js` e substitua as URLs:

```javascript
remote: {
    scriptDataUrl: 'https://SUA-URL-AQUI/script-data.json',
    configUrl: 'https://SUA-URL-AQUI/config.js',
},
```

### **Passo 3: Distribua para a Equipe**

Envie apenas o arquivo `Script_Atendimento_Fibramar.html` para sua equipe.

---

## 👥 **Para a Equipe - Como Usar**

### **Instalação Simples**
1. Baixe o arquivo `Script_Atendimento_Fibramar.html`
2. Abra no seu navegador (Chrome, Firefox, Edge)
3. Pronto! O sistema carregará automaticamente os dados mais recentes

### **Funcionalidades Principais**

#### **📋 Mensagens de Atendimento**
- **Busca rápida**: Digite palavras-chave na caixa de pesquisa
- **Mensagens longas**: Clique em "Ver mais" para expandir
- **Copiar**: Clique na mensagem ou no botão "Copiar"

#### **📝 Bloco de Notas**
- **Abrir**: Clique no ícone de notas flutuante
- **Salvar**: Automático no navegador
- **Exportar**: Botão para baixar como arquivo .txt
- **Importar**: Carregar arquivo de texto existente

#### **🧮 Calculadora Financeira**
- **Proporcional**: Calcule valores por dias
- **Acordo**: Aplique descontos
- **Comissão**: Calcule percentuais

#### **🌙 Modo Escuro**
- Clique no ícone de lua/sol no cabeçalho

### **🔄 Atualizações Automáticas**
- O sistema verifica atualizações a cada 5 minutos
- Notificações aparecem quando há novos dados
- Não precisa recarregar a página

---

## 🛠️ **Para Administradores - Como Atualizar**

### **Atualizando Mensagens e Dados**

1. **Edite o arquivo `script-data.json`**:
   ```json
   {
     "version": "2.2.0",  // ← Aumente a versão
     "company": {
       "name": "Fibramar",
       "attendant": "[NOME_ATENDENTE]"
     },
     "scriptData": {
       "✅ INÍCIO DE ATENDIMENTO": [
         "Nova mensagem aqui..."  // ← Adicione/edite mensagens
       ]
     }
   }
   ```

2. **Faça upload do arquivo atualizado** para sua hospedagem

3. **Todos os usuários receberão automaticamente** a atualização em até 5 minutos

### **Adicionando Novas Categorias**

```json
"scriptData": {
  "🆕 NOVA CATEGORIA": [
    "Primeira mensagem da nova categoria",
    "Segunda mensagem da nova categoria"
  ]
}
```

### **Atualizando Senhas**

```json
"passwords": {
  "title": "🔐 SENHAS PADRÃO",
  "items": [
    {
      "title": "Nova Localização",
      "data": [
        ["Tipo", "Usuário", "Senha"],
        ["WiFi", "admin", "123456"]
      ]
    }
  ]
}
```

---

## 🔧 **Configurações Avançadas**

### **Personalizar Intervalos de Atualização**

No `config.js`:
```javascript
update: {
    checkInterval: 300000,  // 5 minutos (em milissegundos)
    autoUpdate: true,       // Ativar atualizações automáticas
    showNotifications: true // Mostrar notificações
}
```

### **Configurar Backup Automático**

```javascript
backup: {
    autoSave: true,
    interval: 300000,  // 5 minutos
    maxBackups: 10     // Máximo de backups
}
```

---

## 📱 **Compatibilidade**

- ✅ Chrome (recomendado)
- ✅ Firefox
- ✅ Edge
- ✅ Safari
- ✅ Mobile (Android/iOS)

---

## 🆘 **Suporte**

### **Problemas Comuns**

**❌ "Erro ao carregar dados"**
- Verifique se as URLs no `config.js` estão corretas
- Confirme se os arquivos estão acessíveis publicamente

**❌ "Atualizações não funcionam"**
- Verifique a conexão com internet
- Confirme se `autoUpdate: true` no config.js

**❌ "Mensagens não aparecem"**
- Verifique o formato do `script-data.json`
- Use um validador JSON online

### **Logs de Debug**

Abra o Console do navegador (F12) para ver logs detalhados.

---

## 📈 **Versionamento**

- **v2.0.0**: Sistema modular com atualizações automáticas
- **v2.1.0**: Sistema de expansão de mensagens
- **v2.2.0**: Próximas melhorias...

---

**🎯 Desenvolvido para otimizar o atendimento da Fibramar**