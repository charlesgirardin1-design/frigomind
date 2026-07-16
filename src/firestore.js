// -----------------------------------------------------------------------------
// firestore.js
// Initialise Firestore séparément de firebase.js (Auth) : firebase.js est
// importé au démarrage de l'app (AuthContext.jsx), alors que ce fichier n'est
// importé qu'à la demande par cloudSync.js (import dynamique, voir
// AppContext.jsx). Ainsi `firebase/firestore` — une grosse dépendance — ne
// rejoint le bundle que si la sauvegarde cloud est réellement utilisée
// (compte connecté), jamais pour un simple visiteur non connecté.
// -----------------------------------------------------------------------------

import { getFirestore } from 'firebase/firestore'
import { firebaseApp } from './firebase.js'

// La base Firestore de ce projet a été créée sous l'identifiant "frigomind"
// plutôt que "(default)" (visible dans la console Firebase, à côté du titre
// "Base de données") — getFirestore() sans second argument cible toujours
// "(default)", qui n'existe pas ici, d'où des lectures/écritures qui
// échouaient silencieusement (voir cloudSync.js) sans jamais rien
// enregistrer. Il faut donc préciser l'identifiant explicitement.
const FIRESTORE_DATABASE_ID = 'frigomind'

export const db = firebaseApp ? getFirestore(firebaseApp, FIRESTORE_DATABASE_ID) : null
