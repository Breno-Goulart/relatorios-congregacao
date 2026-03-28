import axios from 'axios';
import pLimit from 'p-limit';

// As variáveis de ambiente devem ser injetadas via CLI na pipeline

const NETLIFY_AUTH_TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const SITE_ID = '07804961-9c60-496e-bc3e-329432f8db54'; 

const limit = pLimit(5);

async function deleteDeploys() {
  if (!NETLIFY_AUTH_TOKEN) {
    console.error('ERRO: NETLIFY_AUTH_TOKEN não definido.');
    process.exit(1);
  }

  try {
    console.log('--- LIMPANDO DEPLOYS ANTIGOS (NETLIFY) ---');
    
    const response = await axios.get(
      `https://api.netlify.com/api/v1/sites/${SITE_ID}/deploys`,
      { headers: { Authorization: `Bearer ${NETLIFY_AUTH_TOKEN}` } }
    );

    const deploys = response.data;
    console.log(`Encontrados ${deploys.length} deploys.`);

    const deploysToDelete = deploys.filter(d => d.state === 'ready' && !d.published_at);
    console.log(`${deploysToDelete.length} deploys para remover.`);

    const promises = deploysToDelete.map(deploy => 
      limit(async () => {
        try {
          await axios.delete(
            `https://api.netlify.com/api/v1/sites/${SITE_ID}/deploys/${deploy.id}`,
            { headers: { Authorization: `Bearer ${NETLIFY_AUTH_TOKEN}` } }
          );
          console.log(`✅ Removido: ${deploy.id}`);
        } catch (err) {
          console.error(`❌ Erro ao remover ${deploy.id}:`, err.message);
        }
      })
    );

    await Promise.all(promises);
    console.log('--- LIMPEZA CONCLUÍDA ---');

  } catch (error) {
    console.error('Erro na execução:', error.message);
  }
}

deleteDeploys();