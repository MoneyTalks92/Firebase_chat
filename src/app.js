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
  // ha rákattintunk az edit iconra, meghívódik a displayEditMessage függvény
  document.querySelector(`[data-id="${id}"] .fa-pen`).addEventListener('click', () => {
    displayEditMessage(id)
  });
}

function displayEditMessage(id) {
  const markup = /*html*/`
  <div class="popup-container" id="popup">
    <div class="edit-message" id="edit-message" data-id="${id}">
      <div id="close-popup" class="button">
        Close <i class="fa fa-window-close" aria-hidden="true"></i>
      </div>
      <textarea id="edit" name="" cols="30" rows="10">${document.querySelector(`.message[data-id="${id}"] .message-text`).textContent.trim()
    }</textarea>
      <div id="save-message" class="button">
        Save message<i class="fas fa-save"></i>
      </div>
    </div>
  </div>
`;
  document.querySelector('#messages').insertAdjacentHTML('beforeend', markup);

  // ha rákattintunk a close gombra, akkor a popup eltűnik
  document.querySelector('#edit-message #close-popup').addEventListener('click', () => {
    document.querySelector('#popup').remove();
  });

  // ha rákattinunk a save gombra, leolvassuk az új üzenetet, frissítjük, a popupot eltüntetjük, modifyMessage függvényt meghívjuk
  document.querySelector('#save-message .fa-save').addEventListener('click', () => {
    let newMessage = document.querySelector('#edit').value;
    document.querySelector(`.message[data-id="${id}"] .message-text`).textContent = newMessage;
    const edit = document.querySelector('#edit-message').dataset.id;
    document.querySelector('#popup').remove();
    modifyMessage(edit, newMessage);
  });
}

// üzenet módosítása az adatbázisban
async function modifyMessage(id, newMessage) {
  db.collection('messages').doc(id).update({
    message: newMessage
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
      if (change.type === 'removed') {
        removeMessage(change.doc.id);
      }
    });
  });