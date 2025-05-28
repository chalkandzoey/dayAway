# frontend/Dockerfile

FROM node:18
WORKDIR /app
COPY package*.json ./

# Try verbose npm install, ensuring dev dependencies
# Using --legacy-peer-deps in case of peer dependency conflicts that might silently hinder install
RUN npm install --verbose --include=dev --legacy-peer-deps

# <<<--- ADD THIS DIAGNOSTIC LS COMMAND ---<<<
RUN ls -la /app/node_modules/@mui/x-date-pickers/AdapterDateFnsV3* || echo "AdapterDateFnsV3 not found after install"
RUN ls -la /app/node_modules/@mui/x-date-pickers/AdapterDateFns* || echo "AdapterDateFns (general) not found after install"
RUN ls -la /app/node_modules/vite/.bin || echo "Vite .bin directory not found"
# <<<------------------------------------<<<

COPY . .
EXPOSE 3000
CMD [ "npm", "run", "dev" ]