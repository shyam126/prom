// script.js (ES Module) — open in-page modal, log text to Firestore (write-only)

// ---------------------------
// 0) Firebase Initialization
// ---------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp, doc
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

/* 🔧 Your Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyCbWHq6lA1ps1EYnRZ1Fej5WFAK4EnzLco",
  authDomain: "customcount-1ac47.firebaseapp.com",
  databaseURL: "https://customcount-1ac47-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "customcount-1ac47",
  storageBucket: "customcount-1ac47.firebasestorage.app",
  messagingSenderId: "790474863358",
  appId: "1:790474863358:web:259a9aad43e35c49f76baf"
};
const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

// ---------------------------
// 1) DOM references & State
// ---------------------------
const lovedOne = "My Buggiii";
document.getElementById("name").innerText = lovedOne;

const text = `Today I don’t promise perfection,
I promise presence, patience, and honesty.

No matter what tomorrow brings,
I choose you, always 🤍`;

const images      = document.querySelectorAll(".memory-frame img");
const music       = document.getElementById("bgMusic");
const sideCards   = document.getElementById("sideCards");
const flipCards   = document.querySelectorAll(".flip-card");
const resetBtn    = document.getElementById("resetBtn");

const responseModal = document.getElementById("responseModal");
const responseInput = document.getElementById("responseInput");
const respError     = document.getElementById("respError");

let interval = null, index = 0, t = 0;
let currentUid = null;   // anonymous user uid

// ---------------------------
// 2) Anonymous Auth (no reads)
// ---------------------------
onAuthStateChanged(auth, async (user) => {
  try {
    if (!user) {
      await signInAnonymously(auth);
      return;
    }
    currentUid = user.uid; // signed-in anonymous user
  } catch (err) {
    console.error("Auth error:", err);
  }
});

// Helper: subcollection reference `responses/{uid}/events`
function userEventsCol() {
  if (!currentUid) return null;
  return collection(doc(collection(db, "responses"), currentUid), "events");
}

// Append a text response event
async function logTextResponse(message) {
  try {
    const colRef = userEventsCol();
    if (!colRef) {
      console.warn("User not authenticated yet; skipping log.");
      return;
    }
    await addDoc(colRef, {
      eventType: 'text-response',
      message: message,
      lovedOne: lovedOne,
      userAgent: navigator.userAgent || null,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to log text response:", err);
  }
}

// ---------------------------
// 3) UI Logic (Typewriter, Slides, Cards)
// ---------------------------

// ✍️ Typewriter
(function typeWriter(){
    const el = document.getElementById("typeText");
    if (t < text.length){
        el.innerHTML += (text[t] === "\n" ? "<br>" : text[t]);
        t++;
        setTimeout(typeWriter, 40);
    }
})();

// 🎞 Slideshow + Music (starts on first click anywhere)
function startExperience(){
    if(interval) return;
    music.volume = .5;
    music.play().catch(()=>{/* autoplay may be blocked; user will tap later */});
    interval = setInterval(()=>{
        images[index].classList.remove("active");
        index = (index + 1) % images.length;
        images[index].classList.add("active");
    }, 3500);
}
document.addEventListener("click", startExperience, {once:true});

// 🤍 Show all cards
function showAllCards(){
  sideCards.classList.add("show");
}
window.showAllCards = showAllCards; // expose for inline onclick

// Flip a card and check if all are flipped
function flipCard(card){
  card.classList.toggle("flipped");
  checkAllFlipped();
}
window.flipCard = flipCard;

// When all cards are flipped, show reset button
function checkAllFlipped(){
  const allFlipped = [...flipCards].every(c => c.classList.contains("flipped"));
  resetBtn.classList.toggle("show", allFlipped);
}

// ---------------------------
// 4) Modal: open / close / submit
// ---------------------------
function openResponseModal(){
  respError.textContent = "";
  responseInput.value = "";
  responseModal.classList.add("show");
  responseModal.setAttribute("aria-hidden","false");

  // Focus textarea shortly after opening
  setTimeout(()=>responseInput.focus(), 50);

  // Trap Enter to submit (Shift+Enter = newline)
  function handleKey(e){
    if(e.key === "Enter" && !e.shiftKey){
      e.preventDefault();
      submitTextResponse();
    } else if (e.key === "Escape"){
      e.preventDefault();
      cancelTextResponse();
    }
  }
  responseModal.addEventListener("keydown", handleKey, { once:false });

  // Store to remove later when closed
  responseModal._keyHandler = handleKey;
}
window.openResponseModal = openResponseModal;

function closeResponseModal(){
  if (responseModal._keyHandler){
    responseModal.removeEventListener("keydown", responseModal._keyHandler);
    delete responseModal._keyHandler;
  }
  responseModal.classList.remove("show");
  responseModal.setAttribute("aria-hidden","true");
}

function cancelTextResponse(){
  closeResponseModal();
}
window.cancelTextResponse = cancelTextResponse;

async function submitTextResponse(){
  const msg = (responseInput.value || "").trim();
  if (!msg){
    respError.textContent = "Please type your response.";
    responseInput.focus();
    return;
  }
  respError.textContent = "";
  await logTextResponse(msg);

  // After successful submit: flip back & hide button
  flipCards.forEach(c => c.classList.remove("flipped"));
  resetBtn.classList.remove("show");

  closeResponseModal();
}
window.submitTextResponse = submitTextResponse;
