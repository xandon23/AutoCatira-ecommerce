# Usa a imagem oficial e leve do Node
FROM node:18-alpine

# Cria a pasta raiz do projeto dentro do contêiner
WORKDIR /app

# Copia os arquivos de configuração do NPM
COPY package*.json ./

# O Docker faz o npm install por você, isoladamente
RUN npm install

# Copia todo o restante do código do Back-end
COPY . .

# Expõe a porta que a API utiliza
EXPOSE 3333

# Comando que liga o servidor Back-end
CMD ["npm", "run", "dev"]