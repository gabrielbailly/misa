# Configuracion Firebase

1. Crea un proyecto en Firebase Console.
2. Activa Authentication con proveedor Google.
3. Activa Firestore Database.
4. Anade `https://gabrielbailly.github.io` en Authentication > Settings > Authorized domains.
5. Copia `.env.example` como `.env.local` y rellena las claves de la app web Firebase.
6. Anade esas mismas claves como GitHub Secrets con los nombres `VITE_FIREBASE_*` de `.env.example`.
7. Anade tambien el secret `VITE_TEACHER_EMAILS` con los correos autorizados separados por coma, por ejemplo `profesor1@colegio.es,profesor2@colegio.es`.
8. Usa estas reglas iniciales en Firestore, cambiando los correos por los profesores autorizados:

```js
rules_version = '2';
service cloud.firestore {
  function isTeacher() {
    return request.auth != null
      && request.auth.token.email in [
        'profesor1@colegio.es',
        'profesor2@colegio.es'
      ];
  }

  match /databases/{database}/documents {
    match /classes/{classId} {
      allow read: if true;
      allow create: if isTeacher()
        && request.resource.data.ownerUid == request.auth.uid;
      allow update, delete: if isTeacher()
        && resource.data.ownerUid == request.auth.uid;
    }
  }
}
```

Los alumnos pueden leer una clase con el enlace `?class=ID`. Solo el profesor propietario puede crear o editar sus clases.
