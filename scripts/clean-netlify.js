import axios from 'axios';
import pLimit from 'p-limit';

const NETLIFY_AUTH_TOKEN = process.env.NETLIFY_AUTH_TOKEN;

// Aqui nós criamos uma lista com as IDs que você colocou no .env
const SITE_IDS = [
  process.env.NETLIFY_SITE_ID_NORTE,
  process.env.NETLIFY_SITE_ID_SUL
].filter(Boolean); // O filter(Boolean) ignora caso alguma delas esteja vazia

const limit = pLimit(5);

async function cleanSite(siteId) {
  console.log(`\n▶ INICIANDO LIMPEZA DO SITE ID: ${siteId}`);
  try {
    const response = await axios.get(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
      { headers: { Authorization: `Bearer ${NETLIFY_AUTH_TOKEN}` } }
    );

    const deploys = response.data;
    console.log(`Encontrados ${deploys.length} deploys neste site.`);

    const currentDeploy = deploys.find(d => d.state === 'ready' && d.published_at);
    const currentDeployId = currentDeploy ? currentDeploy.id : null;

    const deploysToDelete = deploys.filter(d => d.id !== currentDeployId);
    console.log(`${deploysToDelete.length} deploys serão removidos. Preservando o atual: ${currentDeployId}`);

    const promises = deploysToDelete.map(deploy => 
      limit(async () => {
        try {
          await axios.delete(
            `https://api.netlify.com/api/v1/sites/${siteId}/deploys/${deploy.id}`,
            { headers: { Authorization: `Bearer ${NETLIFY_AUTH_TOKEN}` } }
          );
          console.log(`✅ Removido: ${deploy.id} (${deploy.context})`);
        } catch (err) {
          console.error(`❌ Erro ao remover ${deploy.id}:`, err.response?.status || err.message);
        }
      })
    );

    await Promise.all(promises);
    console.log(`✔ LIMPEZA CONCLUÍDA PARA O SITE: ${siteId}`);
  } catch (error) {
    console.error(`❌ Erro crítico ao processar o site ${siteId}:`, error.message);
  }
}

async function deleteDeploys() {
  if (!NETLIFY_AUTH_TOKEN) {
    console.error('ERRO: NETLIFY_AUTH_TOKEN não definido no arquivo .env.');
    process.exit(1);
  }

  if (SITE_IDS.length === 0) {
    console.error('ERRO: Nenhuma ID de site encontrada no .env (Verifique NETLIFY_SITE_ID_NORTE ou SUL).');
    process.exit(1);
  }

  console.log('=== INICIANDO LIMPEZA EM MASSA (NETLIFY) ===');

  // O "for" vai rodar a limpeza para o site da Norte e, quando terminar, roda para a Sul automaticamente
  for (const siteId of SITE_IDS) {
    await cleanSite(siteId);
  }

  console.log('\n🎉 TODOS OS SITES FORAM LIMPOS COM SUCESSO! ===\n');
}

deleteDeploys();