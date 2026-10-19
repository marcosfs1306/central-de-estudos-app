// Importações modulares diretas da CDN do Firebase (Garante que funciona sem erros no Netlify)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, deleteDoc, doc, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// COLOQUE AQUI AS CONFIGURAÇÕES DO SEU FIREBASE
const firebaseConfig = {
     apiKey: "AIzaSyCRBOjjxYQGDbFUYs3ITV4x34zvfd_XGC0",
  authDomain: "central-de-estudo.firebaseapp.com",
  projectId: "central-de-estudo",
  storageBucket: "central-de-estudo.firebasestorage.app",
  messagingSenderId: "643948297090",
  appId: "1:643948297090:web:184976d1b8372b15886d9b"
};

// Inicialização segura do Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Mapeamento de elementos do Ecrã
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const userName = document.getElementById('userName');
const btnLoginGoogle = document.getElementById('btnLoginGoogle');
const btnSair = document.getElementById('btnSair');

const formMateria = document.getElementById('formMateria');
const listaMaterias = document.getElementById('listaMaterias');
const materiaAtual = document.getElementById('materiaAtual');

const cronometroEl = document.getElementById('cronometro');
const btnIniciar = document.getElementById('btnIniciar');
const btnFinalizar = document.getElementById('btnFinalizar');

let currentUser = null;
let unsubscribeMaterias = null;
let disciplinas = [];

// --- 1. AUTENTICAÇÃO ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        userName.textContent = `Olá, ${user.displayName.split(' ')[0]}`;
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        carregarDisciplinas();
    } else {
        currentUser = null;
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        if (unsubscribeMaterias) unsubscribeMaterias(); // Pára de ler dados se fizer logout
    }
});

btnLoginGoogle.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Erro na autenticação:", error);
        alert("Ocorreu um erro ao tentar iniciar sessão com o Google.");
    }
});

btnSair.addEventListener('click', () => {
    pararCronometro();
    signOut(auth);
});

// --- 2. GESTÃO DO EDITAL (Firestore Isolado por Utilizador) ---
function carregarDisciplinas() {
    // Busca apenas as disciplinas do utilizador atual, ordenadas por data
    const q = query(collection(db, `users/${currentUser.uid}/materias`), orderBy('criadoEm', 'asc'));
    
    unsubscribeMaterias = onSnapshot(q, (snapshot) => {
        listaMaterias.innerHTML = '';
        disciplinas = [];
        
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            disciplinas.push({ id: docSnap.id, ...data });
            
            const li = document.createElement('li');
            li.innerHTML = `
                <span><strong>${data.nome}</strong> (Peso ${data.peso})</span>
                <button class="delete-btn" data-id="${docSnap.id}">✕</button>
            `;
            listaMaterias.appendChild(li);
        });

        atualizarCiclo();
        
        // Ativar os botões de apagar matéria
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                await deleteDoc(doc(db, `users/${currentUser.uid}/materias`, id));
            });
        });
    });
}

formMateria.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('nomeMateria').value;
    const peso = document.getElementById('pesoMateria').value;

    if (nome && peso) {
        await addDoc(collection(db, `users/${currentUser.uid}/materias`), {
            nome: nome,
            peso: Number(peso),
            criadoEm: new Date()
        });
        formMateria.reset();
    }
});

function atualizarCiclo() {
    if (disciplinas.length === 0) {
        materiaAtual.textContent = "Adicione disciplinas ao edital primeiro.";
        btnIniciar.disabled = true;
        return;
    }
    btnIniciar.disabled = false;
    // Para MVP do ciclo, puxa a primeira matéria da lista. 
    materiaAtual.textContent = disciplinas[0].nome;
}

// --- 3. LÓGICA DO CRONÓMETRO ---
let tempoSegundos = 0;
let intervalo = null;

function formatarTempo(segundos) {
    const h = String(Math.floor(segundos / 3600)).padStart(2, '0');
    const m = String(Math.floor((segundos % 3600) / 60)).padStart(2, '0');
    const s = String(segundos % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

btnIniciar.addEventListener('click', () => {
    if (intervalo) {
        // Pausar
        pararCronometro();
        btnIniciar.textContent = "▶ Retomar";
        btnIniciar.classList.replace('btn-primary', 'btn-outline');
    } else {
        // Iniciar
        intervalo = setInterval(() => {
            tempoSegundos++;
            cronometroEl.textContent = formatarTempo(tempoSegundos);
        }, 1000);
        btnIniciar.textContent = "⏸ Pausar";
        btnIniciar.classList.replace('btn-outline', 'btn-primary');
        btnFinalizar.disabled = false;
    }
});

btnFinalizar.addEventListener('click', () => {
    pararCronometro();
    alert(`Parabéns! Bloco de ${materiaAtual.textContent} finalizado.\nTempo líquido: ${formatarTempo(tempoSegundos)}`);
    tempoSegundos = 0;
    cronometroEl.textContent = "00:00:00";
    btnIniciar.textContent = "▶ Iniciar";
    btnFinalizar.disabled = true;
});

function pararCronometro() {
    clearInterval(intervalo);
    intervalo = null;
}
