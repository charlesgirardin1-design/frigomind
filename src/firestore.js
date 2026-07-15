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

export const db = firebaseApp ? getFirestore(firebaseApp) : null
