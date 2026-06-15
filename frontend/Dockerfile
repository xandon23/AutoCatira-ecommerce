# Usa a imagem oficial do Node
FROM node:18-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos do NPM
COPY package*.json ./

# Instala as dependências do Front-end
RUN npm install

# Copia o código fonte da interface
COPY . .

# Expõe a porta padrão do Vite/React
EXPOSE 3000

# Comando para iniciar o Front-end em modo de desenvolvimento
CMD ["npm", "start"]