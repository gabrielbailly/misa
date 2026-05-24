# Configuracion Firebase

1. Crea un proyecto en Firebase Console.
2. Activa Authentication con proveedor Google.
3. Activa Firestore Database.
4. Activa Firebase Storage.
5. Anade `https://gabrielbailly.github.io` en Authentication > Settings > Authorized domains.
6. Copia `.env.example` como `.env.local` y rellena las claves de la app web Firebase.
7. Anade esas mismas claves como GitHub Secrets con los nombres `VITE_FIREBASE_*` de `.env.example`.
8. Anade tambien el secret `VITE_TEACHER_EMAILS` con los correos autorizados separados por coma, por ejemplo `profesor1@colegio.es,profesor2@colegio.es`.
9. Usa estas reglas iniciales en Firestore, cambiando los correos por los profesores autorizados:

```js
rules_version = '2';
service cloud.firestore {
  function isTeacher() {
    return request.auth != null
      && (
      request.auth.token.email in [
        'profesor1@colegio.es',
        'profesor2@colegio.es'
      ]
      || exists(/databases/$(database)/documents/teachers/$(request.auth.token.email))
      );
  }

  match /databases/{database}/documents {
    match /teachers/{email} {
      allow read: if request.auth != null;
      allow create, update, delete: if isTeacher();
    }

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

10. Usa estas reglas iniciales en Storage:

```js
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /classes/{classId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Los alumnos pueden leer una clase con el enlace `?class=ID`. Solo el profesor propietario puede crear o editar sus clases.

Si al pulsar `Crear clase` aparece un error de permisos, revisa que tu correo este incluido en la funcion `isTeacher()` de estas reglas, o crea manualmente un documento en `teachers` con ID igual a tu correo en minusculas.
