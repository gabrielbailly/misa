# Configuracion Firebase

1. Crea un proyecto en Firebase Console.
2. Activa Authentication con proveedor Google.
3. Activa Firestore Database.
4. Anade `https://gabrielbailly.github.io` en Authentication > Settings > Authorized domains.
5. Copia `.env.example` como `.env.local` y rellena las claves de la app web Firebase.
6. Anade esas mismas claves como GitHub Secrets con los nombres `VITE_FIREBASE_*` de `.env.example`.
7. Usa estas reglas iniciales en Firestore:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /classes/{classId} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.ownerUid == request.auth.uid;
      allow update, delete: if request.auth != null
        && resource.data.ownerUid == request.auth.uid;
    }
  }
}
```

Los alumnos pueden leer una clase con el enlace `?class=ID`. Solo el profesor propietario puede crear o editar sus clases.
