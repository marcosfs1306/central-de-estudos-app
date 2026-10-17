// ==========================================
// 3. LÓGICA DO CICLO DE ESTUDOS (DASHBOARD)
// ==========================================

const formMateria = document.getElementById('formMateria');
const listaMaterias = document.getElementById('listaMaterias');

// Função para buscar e listar matérias do Firestore
async function carregarMaterias() {
  const user = auth.currentUser;
  if (!user) return;

  listaMaterias.innerHTML = '<p style="color: #666; font-size: 0.9rem;">A carregar matérias...</p>';

  try {
    // Procura na subcoleção 'materias' DENTRO do documento deste utilizador
    const snapshot = await db.collection('users').doc(user.uid).collection('materias').orderBy('criadoEm').get();
    
    listaMaterias.innerHTML = ''; // Limpa o "A carregar"

    if(snapshot.empty) {
        listaMaterias.innerHTML = '<p style="color: #666; font-size: 0.9rem;">Nenhuma matéria cadastrada. Adicione a sua primeira disciplina do edital acima!</p>';
        return;
    }

    snapshot.forEach(doc => {
      const mat = doc.data();
      listaMaterias.innerHTML += `
        <li class="materia-item">
          <span><strong>${mat.nome}</strong> <span style="color:#888; font-size: 0.8rem;">(Peso ${mat.peso})</span></span>
          <span style="font-weight: 600; color: #4338ca;">${mat.horasLiquidas}h</span>
        </li>
      `;
    });
  } catch (error) {
    console.error("Erro ao carregar matérias:", error);
    listaMaterias.innerHTML = '<p style="color: red;">Erro ao carregar dados.</p>';
  }
}

// Evento: Quando o utilizador clica em "+" para adicionar matéria
formMateria.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const nome = document.getElementById('nomeMateria').value;
  const peso = parseInt(document.getElementById('pesoMateria').value);
  const btnSubmit = formMateria.querySelector('button');

  btnSubmit.disabled = true;
  btnSubmit.innerText = '...';

  try {
    // Salva no banco de dados, respeitando as regras de segurança
    await db.collection('users').doc(user.uid).collection('materias').add({
      nome: nome,
      peso: peso,
      horasLiquidas: 0, // Começa sempre com 0 horas estudadas
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    formMateria.reset(); // Limpa o formulário
    carregarMaterias();  // Atualiza a lista na tela instantaneamente
  } catch (error) {
    console.error("Erro ao salvar matéria:", error);
    alert("Erro ao guardar. Verifique as permissões.");
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerText = '+';
  }
});
