# Tanto amó Dios al mundo

Guía para el profesor

## Presentación

**Tanto amó Dios al mundo** es una web interactiva para ayudar a los alumnos a comprender la celebración de la Santa Misa.

El recurso presenta las partes principales de la Eucaristía con explicaciones breves, imágenes, vídeos, oraciones y actividades. Está pensado para utilizarse en clase, guiado por el profesor, o como material de repaso para los alumnos.

El objetivo principal no es solo que los alumnos memoricen el orden de la Misa, sino que comprendan qué ocurre en cada momento y qué sentido tiene para la vida cristiana.

## Organización del contenido

La aplicación se abre con una portada titulada **Tanto amó Dios al mundo**. Desde ella se puede acceder al prólogo, a la información de la aplicación y al recorrido principal.

Al pulsar **Empezar**, se entra en el apartado **La celebración de la Eucaristía**.

El contenido está dividido en cinco bloques:

1. Lugar de la celebración y ornamentos
2. Ritos iniciales
3. Liturgia de la Palabra
4. Liturgia Eucarística
5. Rito de despedida

Cada bloque contiene tarjetas con explicación, recursos visuales, ideas clave y actividades. Algunas tarjetas incluyen también oraciones propias de la Misa, como el **Yo confieso**, el **Gloria**, el **Credo**, el **Santo** o el **Padrenuestro**.

## Qué encuentra el alumno

En cada apartado, el alumno puede trabajar con:

- Una explicación breve y adaptada del momento de la Misa.
- Una imagen o vídeo relacionado.
- Un recuadro **Recuerda** con la idea principal.
- Oraciones litúrgicas cuando corresponde.
- Actividades sencillas de comprensión.

Las actividades pueden ser de tres tipos:

- **Elige**: pregunta con varias opciones.
- **Relaciona**: unión de conceptos con su significado.
- **Ordena**: colocación de pasos en la secuencia correcta.

## Propuesta de uso en clase

La aplicación puede utilizarse de distintas formas:

- Como apoyo visual durante una explicación sobre la Misa.
- Como recorrido por sesiones, dedicando una clase a cada bloque.
- Como actividad individual o por parejas.
- Como repaso antes o después de asistir a una celebración eucarística.
- Como material complementario en Religión, catequesis o preparación sacramental.

Una forma sencilla de trabajo es:

1. Presentar el bloque que se va a estudiar.
2. Leer con los alumnos las tarjetas principales.
3. Ver las imágenes o vídeos correspondientes.
4. Comentar el recuadro **Recuerda**.
5. Realizar las actividades de comprensión.
6. Cerrar la sesión con una breve puesta en común.

## Modo profesor

Desde la pantalla principal de contenidos aparece el botón **Profesor**.

El modo profesor permite preparar la experiencia de los alumnos:

- Crear clases.
- Generar un enlace específico para cada clase.
- Bloquear o desbloquear bloques de contenido.
- Editar el texto introductorio.
- Editar los textos de cada tarjeta.
- Editar el recuadro **Recuerda**.
- Editar, añadir o eliminar actividades.
- Añadir otros correos de profesores autorizados, si Firebase está configurado.

Cuando Firebase está configurado, el profesor accede con Google y los cambios se guardan para la clase seleccionada. Así, los alumnos pueden abrir el enlace de su clase desde cualquier dispositivo y ver la versión preparada por su profesor.

Si Firebase no está configurado, la app funciona en modo local. En ese caso, los cambios se guardan solo en el navegador desde el que se está usando.

## Clases y enlaces para alumnos

En el modo profesor se puede crear una clase, por ejemplo **4A**, **5 Primaria** o **1 ESO B**.

Al seleccionar una clase, la aplicación muestra un **enlace para alumnos**. Ese enlace contiene el identificador de la clase y carga automáticamente la configuración preparada por el profesor.

Los alumnos no necesitan cuenta de profesor. Solo tienen que abrir el enlace de su clase y accederán al contenido que el profesor haya dejado disponible.

## Bloqueo de contenidos

El profesor puede bloquear o desbloquear bloques completos.

Esto permite:

- Mostrar solo el bloque que se va a trabajar ese día.
- Evitar que los alumnos avancen a partes todavía no explicadas.
- Desbloquear todo al final como material de repaso.
- Adaptar el ritmo al grupo.

Los bloques bloqueados aparecen como no disponibles para el alumno.

## Edición de textos

El profesor puede modificar los textos de la aplicación para adaptarlos al nivel de su grupo.

Se pueden editar:

- El texto introductorio de **La celebración de la Eucaristía**.
- El texto principal de cada tarjeta.
- El texto del apartado **Recuerda**.

El editor permite aplicar formato sencillo, como negrita, cursiva y listas.

## Edición de actividades

Cada tarjeta puede tener actividades propias. Desde el modo profesor se pueden modificar las actividades existentes o crear otras nuevas.

Tipos disponibles:

- **Elige**: se escribe una pregunta, varias opciones y la respuesta correcta.
- **Relaciona**: se crean parejas de concepto y explicación.
- **Ordena**: se escriben los pasos en el orden correcto.

Esto permite adaptar la dificultad, cambiar el vocabulario o preparar actividades más cercanas a lo trabajado en clase.

## Recomendaciones didácticas

- Preparar la clase antes de compartir el enlace con los alumnos.
- Crear una clase distinta para cada grupo si se quieren configuraciones diferentes.
- Desbloquear solo los bloques necesarios para cada sesión.
- Revisar los textos editados antes de usarlos con alumnos.
- Utilizar las actividades como comprobación rápida de comprensión.
- Combinar el trabajo digital con diálogo en clase y explicación del profesor.

## Notas técnicas básicas

La app está desarrollada con React, Vite y Firebase.

Firebase se utiliza para:

- Acceso de profesores con Google.
- Guardado de clases.
- Guardado de textos, actividades y bloqueos por clase.
- Autorización de profesores que pueden gestionar contenido.

La configuración técnica de Firebase está documentada en `FIREBASE_SETUP.md`.

## Autoría y uso

Web interactiva desarrollada por Gabriel Bailly-Bailliere Torres-Pardo, profesor del colegio Alcaste - Las Fuentes, La Rioja.

La web es un recurso educativo sin ánimo de lucro. Los contenidos gráficos y audiovisuales incluidos no son propiedad del autor.
