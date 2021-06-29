import './index.html';
import './scss/style.scss';
import firebase from 'firebase/app';
import 'firebase/firestore';
import config from './db_config.js';
import scrollIntoView from 'scroll-into-view-if-needed';

const firedb = firebase.initializeApp(config);
const db = firedb.firestore();


async function sendMessage(data) {
  const res = await db.collection('messages').add(data);
  document.querySelector('#message').value = '';
  console.log(res);
}

function displayMessage(message, id) {
  const messageDOM = `<div class="message" data-id="${id}">
  <i class="fas fa-user"></i>
  <div>
    <span class="username">${message.username}
      <time>${message.date}</time>
    </span>
    <br>
    <span class="message-text">${message.message}
    </span>
  </div>
  <div class="message-edit-buttons">
    <i class="fas fa-trash-alt"></i>
    <i class="fas fa-pen"></i>
  </div>
</div>`;
  document.querySelector('#messages').insertAdjacentHTML('beforeend', messageDOM);
  scrollIntoView(document.querySelector('#messages'), {
    scrollMode: 'if-needed',
    block: 'end'
  });
  document.querySelector(`[data-id="${id}"] .fa-trash-alt`).addEventListener('click', () => {
    deleteMessage(id);
    removeMessage(id);
  });
}

const createMessage = () => {
  const message = document.querySelector('#message').value;
  const username = document.querySelector('#nickname').value;
  // dátum átkonvertálása, majd átalakítása
  const date = firebase.firestore.Timestamp.fromDate(new Date()).toDate().toLocaleString('hu-HU');
  // ha a változó neve ugyanaz, mint a key amit létre akarunk hozni az objectben, akkor nem kell kétszer kiírni
  return {
    message,
    username,
    date
  };
}

// üzenet törlése az UI-ról
function removeMessage(id) {
  document.querySelector(`[data-id="${id}"]`).remove();
}

// üzenet törlése az adatbázisból
function deleteMessage(id) {
  db.collection('messages').doc(id).delete();
}

async function displayAllMessages() {
  const query = await db.collection('messages').orderBy('date', 'asc').get();
  query.forEach((doc) => {
    displayMessage(doc.data());
  });
}

function handleMessage() {
  const message = createMessage();
  if (message.username && message.message) {
    sendMessage(message);
    //displayMessage(message);
  }
}

// amikor a html teljesen betölt
window.addEventListener('DOMContentLoaded', () => {
  //displayAllMessages();
  document.querySelector('#send').addEventListener('click', () => {
    handleMessage();
  });
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    handleMessage();
  }
});

// listen for changes in the database
db.collection('messages').orderBy('date', 'asc')
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      // változások vizsgálata
      if (change.type === 'added') {
        displayMessage(change.doc.data(), change.doc.id);
      }
      if (change.type === 'modified') {
        displayMessage(change.doc.data(), change.doc.id);
      }
      if (change.type === 'removed') {
        removeMessage(change.doc.id);
      }
    });
  });