const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

exports.catalogarPublicador = onDocumentCreated("relatorios/{relatorioId}", async (event) => {
  const data = event.data.data();
  if (!data || !data.nome) return null;

  const nomeCorrigido = data.nome;
  const pubQuery = await db.collection("publicadores").where("nome", "==", nomeCorrigido).get();

  if (pubQuery.empty) {
    await db.collection("publicadores").add({
      nome: nomeCorrigido,
      nome_busca: data.nome_busca || "",
      tipo_padrao: data.tipo || "Publicador(a)",
      dataCriacao: FieldValue.serverTimestamp()
    });
  }
  
  return null;
});