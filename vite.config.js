import { defineConfig } from 'vite';

/**
 * Configuração do Vite para desenvolvimento e preview em LAN.
 *
 * Motivo: a validação de `Host` do Vite 6/7 devolve 403 para nomes de
 * máquina (ex.: http://LAB-PC:5173), permitindo apenas localhost e IPs.
 * `allowedHosts: true` libera qualquer Host, incluindo nome de PC, domínio
 * local e IP, para que todos os computadores da rede acessem a mesma URL.
 *
 * O bind em `0.0.0.0` (todos os endereços) já vem do script npm
 * (`vite --host 0.0.0.0`); `host: true` aqui cobre o caso de `npm run dev`
 * ser chamado sem o flag.
 */
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    allowedHosts: true,
    cors: true,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
    allowedHosts: true,
    cors: true,
  },
});
