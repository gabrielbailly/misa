import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Heart,
  HelpCircle,
  MessageCircle,
  Music,
  PlayCircle,
  RotateCcw,
  Send,
  Sparkles,
  Sun,
  Trash2,
  Trophy,
  Users,
  Wine,
  X,
  ScrollText
} from 'lucide-react';
import { auth, db, googleProvider, isFirebaseConfigured } from './firebase';

// Ajuste para GitHub Pages
const BASE_URL = import.meta.env.BASE_URL || '/';
const asset = (path) => encodeURI(BASE_URL + path.replace(/^\//, '').normalize('NFC'));
const getAppPath = (path) => new URL(path, window.location.origin).pathname.replace(/\/$/, '') || '/';
const getTeacherPath = () => `${getAppPath(BASE_URL) === '/' ? '' : getAppPath(BASE_URL)}/profesor`;
const isTeacherRoute = () => getAppPath(window.location.pathname) === getTeacherPath();
const TEACHER_PASSWORD = 'misa2026';
const LOCKED_SECTIONS_KEY = 'misa-locked-sections';
const ACTIVE_CLASS_KEY = 'misa-active-class';
const TEXT_OVERRIDES_KEY = 'misa-text-overrides';
const INTRO_OVERRIDES_KEY = 'misa-intro-overrides';
const ACTIVITY_OVERRIDES_KEY = 'misa-activity-overrides';
const GAME_VISIBLE_KEY = 'misa-game-visible';
const GAME_QUESTIONS_KEY = 'misa-game-questions';
const IMAGE_OVERRIDES_KEY = 'misa-image-overrides';
const STUDENT_LIST_KEY = 'misa-student-list';
const TEACHER_EMAILS = (import.meta.env.VITE_TEACHER_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const normalizeEmail = (email) => email.trim().toLowerCase();
const isBootstrapTeacher = (user) => Boolean(user?.email && TEACHER_EMAILS.includes(normalizeEmail(user.email)));

// --- Estructura de Oraciones ---
const prayers = {
  'Yo confieso': [
    { role: '', text: 'Yo confieso ante Dios todopoderoso y ante vosotros, hermanos, que he pecado mucho de pensamiento, palabra, obra y omisión. Por mi culpa, por mi culpa, por mi gran culpa. Por eso ruego a santa María, siempre Virgen, a los ángeles, a los santos y a vosotros, hermanos, que intercedáis por mí ante Dios, nuestro Señor.' }
  ],
  'Gloria': [
    { role: 'Todos', text: 'Gloria a Dios en el cielo, y en la tierra paz a los hombres que ama el Señor. Por tu inmensa gloria te alabamos, te bendecimos, te adoramos, te glorificamos, te damos gracias, Señor Dios, Rey celestial, Dios Padre todopoderoso. Señor, Hijo único, Jesucristo. Señor Dios, Cordero de Dios, Hijo del Padre; tú que quitas el pecado del mundo, ten piedad de nosotros; tú que quitas el pecado del mundo, atiende nuestra súplica; tú que estás sentado a la derecha del Padre, ten piedad de nosotros; porque sólo tú eres Santo, sólo tú Señor, sólo tú Altísimo, Jesucristo, con el Espíritu Santo en la gloria de Dios Padre. Amén.' }
  ],
  'Credo': [
    { role: 'Todos', text: 'Creo en Dios, Padre todopoderoso, Creador del cielo y de la tierra. Creo en Jesucristo, su único Hijo, nuestro Señor, que fue concebido por obra y gracia del Espíritu Santo, nació de Santa María Virgen, padeció bajo el poder de Poncio Pilato, fue crucificado, muerto y sepultado, descendió a los infiernos, al tercer día resucitó de entre los muertos, subió a los cielos y está sentado a la derecha de Dios, Padre todopoderoso. Desde allí ha de venir a juzgar a vivos y muertos. Creo en el Espíritu Santo, la santa Iglesia católica, la comunión de los santos, el perdón de los pecados, la resurrección de la carne y la vida eterna. Amén.' }
  ],
  'Bendito seas': [
    { role: 'Sacerdote', text: 'Bendito seas, Señor, Dios del universo, por este pan, fruto de la tierra y del trabajo del hombre, que recibimos de tu generosidad y ahora te presentamos; él será para nosotros pan de vida.' },
    { role: 'Fieles', text: 'Bendito seas por siempre, Señor.' },
    { role: 'Sacerdote', text: 'Bendito seas, Señor, Dios del universo, por este vino, fruto de la vid y del trabajo del hombre, que recibimos de tu generosidad y ahora te presentamos; él será para nosotros bebida de salvación.' },
    { role: 'Fieles', text: 'Bendito seas por siempre, Señor.' }
  ],
  'Santo': [
    { role: 'Todos', text: 'Santo, Santo, Santo es el Señor, Dios del universo. Llenos están el cielo y la tierra de tu gloria. Hosanna en el cielo. Bendito el que viene en nombre del Señor. Hosanna en el cielo.' }
  ],
  'Palabras de la consagración': [
    { role: '', text: 'TOMAD Y COMED TODOS DE ÉL, PORQUE ESTO ES MI CUERPO, QUE SERÁ ENTREGADO POR VOSOTROS.' },
    { role: '', text: 'TOMAD Y BEBED TODOS DE ÉL, PORQUE ESTE ES EL CÁLIZ DE MI SANGRE, SANGRE DE LA ALIANZA NUEVA Y ETERNA, QUE SERÁ DERRAMADA POR VOSOTROS Y POR MUCHOS PARA EL PERDÓN DE LOS PECADOS. HACED ESTO EN CONMEMORACIÓN MÍA.' }
  ],
  'Padrenuestro': [
    { role: 'Todos', text: 'Padre nuestro, que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Amén.' }
  ]
};

const prologue = [
  'Tanto amó Dios al mundo que entregó a su Hijo único para que no perezca ninguno de los que creen en él, sino que tengan vida eterna (San Juan 3, 16).',
  'Esto es lo que ocurre en cada Misa que se celebra: Jesús se entrega por amor a todos los hombres.',
  'Es la mayor muestra de amor: dar la vida por los demás.',
  'Así nos demostró y nos demuestra su amor Dios Padre.',
  'Pero para entender mejor lo que significa la Misa, tenemos que detenernos en cada una de sus partes. Y conocer lo que ocurre y qué sentido tiene.',
  'Así la podremos vivir mejor, con más intensidad, con más atención. Y obtendremos más gracias, más ayudas de Dios para nuestra vida.',
  'En este libro podrás seguir las diversas partes de la celebración eucarística mediante los textos y los fragmentos de vídeo.',
  'Estos fragmentos nos presentan a 3 personajes: una madre que ha perdido a su marido, un conductor de autobús padre de un hijo gravemente enfermo y una anciana. Todos ellos acuden a la Misa para pedir ayuda a Dios. Al principio no están seguros pero poco a poco van descubriendo que la Misa es el mejor regalo que Dios nos ha dejado a los hombres. En ella obtenemos todas las gracias que necesitamos para nosotros y nuestros seres queridos.',
  'Cristo vive, está presente en su Iglesia en esa entrega diaria de la sagrada Eucaristía.',
  'Es la mejor muestra de que Tanto amó Dios al mundo…',
];

const appInfo = [
  'Web interactiva desarrollada por Gabriel Bailly-Bailliere Torres-Pardo, profesor del colegio Alcaste- Las Fuentes (La Rioja, España).',
  'Es una web sin ánimo de lucro.',
  'Los contenidos gráficos y audiovisuales no son propiedad del autor.',
  'Mayo 2026',
];

const teacherGuide = [
  {
    title: 'Presentación',
    paragraphs: [
      'Tanto amó Dios al mundo es una web interactiva para ayudar a los alumnos a comprender la celebración de la Santa Misa.',
      'El recurso presenta las partes principales de la Eucaristía con explicaciones breves, imágenes, vídeos, oraciones y actividades. Está pensado para utilizarse en clase, guiado por el profesor, o como material de repaso para los alumnos.',
      'El objetivo principal no es solo que los alumnos memoricen el orden de la Misa, sino que comprendan qué ocurre en cada momento y qué sentido tiene para la vida cristiana.',
    ],
  },
  {
    title: 'Organización del contenido',
    paragraphs: [
      'La aplicación se abre con una portada titulada Tanto amó Dios al mundo. Desde ella se puede acceder al prólogo, a la información de la aplicación y al recorrido principal.',
      'Al pulsar Empezar, se entra en el apartado La celebración de la Eucaristía.',
    ],
    items: [
      'Lugar de la celebración y ornamentos',
      'Ritos iniciales',
      'Liturgia de la Palabra',
      'Liturgia Eucarística',
      'Rito de despedida',
    ],
  },
  {
    title: 'Qué encuentra el alumno',
    paragraphs: ['En cada apartado, el alumno puede trabajar con:'],
    items: [
      'Una explicación breve y adaptada del momento de la Misa.',
      'Una imagen o vídeo relacionado.',
      'Un recuadro Recuerda con la idea principal.',
      'Oraciones litúrgicas cuando corresponde.',
      'Actividades sencillas de comprensión.',
    ],
  },
  {
    title: 'Propuesta de uso en clase',
    paragraphs: ['La aplicación puede utilizarse como apoyo visual, recorrido por sesiones, actividad individual o por parejas, repaso y material complementario en Religión, catequesis o preparación sacramental.'],
    items: [
      'Presentar el bloque que se va a estudiar.',
      'Leer con los alumnos las tarjetas principales.',
      'Ver las imágenes o vídeos correspondientes.',
      'Comentar el recuadro Recuerda.',
      'Realizar las actividades de comprensión.',
      'Cerrar la sesión con una breve puesta en común.',
    ],
  },
  {
    title: 'Modo profesor',
    paragraphs: [
      'El modo profesor permite preparar la experiencia de los alumnos: crear clases, generar enlaces específicos, bloquear o desbloquear bloques, editar textos, imágenes y actividades, mostrar u ocultar el juego de clase, y añadir otros profesores autorizados si Firebase está configurado.',
      'Cuando Firebase está configurado, el profesor accede con Google y los cambios se guardan para la clase seleccionada. Si Firebase no está configurado, los cambios se guardan solo en este navegador.',
    ],
  },
  {
    title: 'Clases y enlaces para alumnos',
    paragraphs: [
      'En el modo profesor se puede crear una clase, por ejemplo 4A, 5 Primaria o 1 ESO B. Al seleccionar una clase, la aplicación muestra un enlace para alumnos que carga automáticamente la configuración preparada por el profesor.',
      'Los alumnos no necesitan cuenta de profesor. Solo tienen que abrir el enlace de su clase y accederán al contenido que el profesor haya dejado disponible.',
    ],
  },
  {
    title: 'Bloqueo, textos y actividades',
    paragraphs: [
      'El profesor puede bloquear bloques completos para mostrar solo lo necesario en cada sesión, evitar que los alumnos avancen antes de tiempo o desbloquear todo al final como repaso.',
      'También puede adaptar el texto introductorio, el texto principal de cada tarjeta, el apartado Recuerda y las actividades de tipo Elige, Relaciona u Ordena.',
      'En cada tarjeta se puede pulsar Editar imagen para ver la imagen actual, reemplazarla por otra subida desde el ordenador o eliminar la imagen subida. Al eliminar una imagen subida, vuelve a mostrarse la imagen original, que nunca se borra.',
    ],
  },
  {
    title: 'Juego de clase',
    paragraphs: [
      'El juego ¿Conoces lo que pasa en Misa? sirve para repasar oralmente los contenidos con toda la clase, proyectando una ruleta de alumnos y preguntas sencillas.',
      'El profesor puede pegar la lista de alumnos. La aplicación elimina nombres repetidos y, cuando un alumno ya ha salido, no vuelve a aparecer en la ruleta.',
      'Al girar la ruleta, queda visible el nombre del alumno y después aparece una pregunta en un modal. El profesor escucha la respuesta y marca Correcta, Regular o Incorrecta. Las respuestas correctas y regulares se guardan en dos listas visibles.',
      'Desde Profesor se puede mostrar u ocultar el botón Juego para los alumnos. También se pueden editar, añadir, eliminar y ordenar las preguntas por Parte o Tema. Si una clase no tiene preguntas propias, puede usar las preguntas guardadas en otras clases del mismo profesor.',
    ],
  },
  {
    title: 'Recomendaciones didácticas',
    items: [
      'Preparar la clase antes de compartir el enlace con los alumnos.',
      'Crear una clase distinta para cada grupo si se quieren configuraciones diferentes.',
      'Desbloquear solo los bloques necesarios para cada sesión.',
      'Revisar los textos editados antes de usarlos con alumnos.',
      'Comprobar las imágenes personalizadas antes de compartir el enlace con la clase.',
      'Utilizar las actividades como comprobación rápida de comprensión.',
      'Usar el juego al final de la sesión como repaso oral y participación de todos.',
      'Combinar el trabajo digital con diálogo en clase y explicación del profesor.',
    ],
  },
];

const cardActivities = {
  'Lugar de la celebración': [
    { type: 'quiz', prompt: '¿Qué es la iglesia?', options: ['Un lugar sagrado donde nos reunimos los cristianos', 'Una sala cualquiera para reuniones', 'Un lugar solo para mirar imágenes'], answer: 'Un lugar sagrado donde nos reunimos los cristianos' },
    { type: 'match', prompt: 'Relaciona cada idea.', pairs: [['Iglesia', 'Casa de Dios'], ['Silencio', 'Señal de respeto y veneración'], ['Eucaristía', 'Celebración principal de los cristianos']] },
  ],
  'Elementos de la iglesia': [
    { type: 'quiz', prompt: '¿Dónde se proclama la Palabra de Dios?', options: ['En el ambón', 'En la nave', 'En las vinajeras'], answer: 'En el ambón' },
    { type: 'match', prompt: 'Une cada parte con su significado.', pairs: [['Altar', 'Mesa donde se celebra el sacrificio de Jesús'], ['Ambón', 'Lugar desde donde se proclama la Palabra'], ['Nave', 'Lugar donde se sitúan los fieles'], ['Presbiterio', 'Espacio principal donde está el altar']] },
    { type: 'order', prompt: 'Ordena desde la entrada hacia el lugar principal.', steps: ['Nave', 'Presbiterio', 'Altar'] },
  ],
  'Ornamentos y posturas': [
    { type: 'quiz', prompt: '¿Para qué se reviste el sacerdote con ornamentos?', options: ['Para celebrar los sacramentos representando a Jesús', 'Para distinguirse por gusto personal', 'Para que la Misa sea más larga'], answer: 'Para celebrar los sacramentos representando a Jesús' },
    { type: 'match', prompt: 'Relaciona cada postura con su sentido.', pairs: [['De pie', 'Respeto y veneración'], ['Sentados', 'Escuchar y reflexionar'], ['Arrodillarse', 'Adorar al Señor'], ['Responder', 'Unirse a la oración del sacerdote']] },
    { type: 'match', prompt: 'Relaciona cada color litúrgico.', pairs: [['Blanco', 'Fiesta'], ['Verde', 'Esperanza'], ['Rojo', 'Sangre y fuego'], ['Morado', 'Penitencia']] },
  ],
  'Objetos litúrgicos': [
    { type: 'quiz', prompt: '¿Por qué los objetos litúrgicos son especiales?', options: ['Porque estarán en contacto con el Cuerpo y la Sangre de Jesús', 'Porque son adornos sin importancia', 'Porque se usan fuera de la iglesia'], answer: 'Porque estarán en contacto con el Cuerpo y la Sangre de Jesús' },
    { type: 'match', prompt: 'Relaciona cada objeto con su función.', pairs: [['Cáliz', 'Copa para la Sangre de Cristo'], ['Patena', 'Platillo para el pan que será consagrado'], ['Copón', 'Recipiente para guardar formas consagradas'], ['Vinajeras', 'Contienen agua y vino'], ['Corporal', 'Lienzo que se coloca sobre el altar']] },
    { type: 'order', prompt: 'Ordena cómo se preparan algunos dones.', steps: ['Se presentan el pan y el vino', 'Se colocan sobre el altar', 'Serán consagrados en la Misa'] },
  ],
  'Introito y acto penitencial': [
    { type: 'quiz', prompt: '¿Para qué nos reunimos en la Misa?', options: ['Para celebrar la Pasión, Muerte y Resurrección de Jesús', 'Para escuchar solo unas lecturas', 'Para hacer una oración privada sin la Iglesia'], answer: 'Para celebrar la Pasión, Muerte y Resurrección de Jesús' },
    { type: 'match', prompt: 'Relaciona cada expresión con su significado.', pairs: [['Jesús sale a nuestro encuentro', 'Él nos reúne en la Misa'], ['Acto penitencial', 'Nos preparamos para el encuentro'], ['Pueblo de Dios', 'La familia que Jesús convoca']] },
    { type: 'order', prompt: 'Ordena lo que ocurre al comenzar.', steps: ['Jesús nos convoca', 'Nos reunimos para celebrar', 'Nos preparamos con el acto penitencial'] },
  ],
  Gloria: [
    { type: 'quiz', prompt: '¿Qué hacemos en el Gloria?', options: ['Alabamos a Dios', 'Pedimos perdón en silencio', 'Proclamamos las lecturas'], answer: 'Alabamos a Dios' },
    { type: 'match', prompt: 'Relaciona.', pairs: [['Gloria', 'Canto de alabanza'], ['Ritos iniciales', 'Comienzo de la celebración'], ['Alegría', 'Actitud de la gran fiesta de Jesús']] },
    { type: 'quiz', prompt: '¿Por qué el Gloria es una oración de alegría?', options: ['Porque celebramos la gran fiesta de Jesús', 'Porque presenta el pan y el vino', 'Porque responde a las peticiones'], answer: 'Porque celebramos la gran fiesta de Jesús' },
  ],
  'Oración colecta': [
    { type: 'quiz', prompt: '¿Qué recoge la oración colecta?', options: ['La oración de toda la Iglesia', 'La explicación de las lecturas', 'La acción de gracias después de comulgar'], answer: 'La oración de toda la Iglesia' },
    { type: 'match', prompt: 'Une cada idea.', pairs: [['Oración colecta', 'Recoge la oración de todos'], ['Comienzo de la celebración', 'Momento en que rezamos unidos'], ['Dios', 'A quien presentamos nuestra oración']] },
  ],
  Lecturas: [
    { type: 'quiz', prompt: '¿Quién nos habla en las lecturas?', options: ['Jesús mismo', 'Solo la persona que lee', 'Solo los discípulos de Emaús'], answer: 'Jesús mismo' },
    { type: 'match', prompt: 'Relaciona.', pairs: [['Lecturas', 'Pasajes de la Biblia'], ['Antiguo Testamento', 'Una parte de la Escritura'], ['Nuevo Testamento', 'Otra parte de la Escritura']] },
    { type: 'quiz', prompt: '¿Qué nos cuenta Dios en su Palabra?', options: ['Lo que hace por nosotros', 'Solo normas para portarnos bien', 'Solo historias antiguas sin relación con nosotros'], answer: 'Lo que hace por nosotros' },
  ],
  'Evangelio y homilía': [
    { type: 'quiz', prompt: '¿Qué proclama el sacerdote en el Evangelio?', options: ['Un pasaje', 'La oración colecta', 'Las peticiones de la oración universal'], answer: 'Un pasaje' },
    { type: 'match', prompt: 'Une cada palabra con su explicación.', pairs: [['Evangelio', 'Jesús nos explica las Escrituras'], ['Homilía', 'Ayuda a comprender la Palabra de Dios'], ['Discípulos de Emaús', 'Jesús les explicó las Escrituras']] },
    { type: 'order', prompt: 'Ordena estos momentos.', steps: ['Se proclama el Evangelio', 'Escuchamos a Jesús', 'La homilía ayuda a aplicar la Palabra a la vida'] },
  ],
  'Credo y Oración universal': [
    { type: 'quiz', prompt: '¿Qué hacemos en el Credo?', options: ['Proclamamos nuestra fe', 'Escuchamos la homilía', 'Bendecimos el pan y el vino'], answer: 'Proclamamos nuestra fe' },
    { type: 'match', prompt: 'Relaciona.', pairs: [['Credo', 'Respondemos proclamando nuestra fe'], ['Oración universal', 'Rezamos por las necesidades'], ['Iglesia y mundo entero', 'Por quienes rezamos']] },
    { type: 'quiz', prompt: '¿Por quién rezamos en la oración universal?', options: ['Por la Iglesia y el mundo entero', 'Solo por quienes van a comulgar', 'Solo por el sacerdote'], answer: 'Por la Iglesia y el mundo entero' },
  ],
  'Presentación de las ofrendas': [
    { type: 'quiz', prompt: '¿Qué se presenta en las ofrendas?', options: ['El pan y el vino', 'La Palabra de Dios proclamada', 'La bendición final'], answer: 'El pan y el vino' },
    { type: 'match', prompt: 'Relaciona.', pairs: [['Pan y vino', 'Dones que se presentan'], ['Bendecir a Dios', 'Dar gracias por esos dones'], ['Jesús', 'Toma el pan y el vino']] },
    { type: 'order', prompt: 'Ordena.', steps: ['Se presentan el pan y el vino', 'Se bendice a Dios por esos dones', 'Jesús toma el pan y el vino'] },
  ],
  'Plegaria Eucarística': [
    { type: 'quiz', prompt: '¿Qué tipo de oración es la Plegaria Eucarística?', options: ['Adoración, alabanza y acción de gracias', 'Lectura y explicación de la Palabra', 'Petición final antes de salir'], answer: 'Adoración, alabanza y acción de gracias' },
    { type: 'match', prompt: 'Une las ideas.', pairs: [['Dios Padre', 'Recibe adoración, alabanza y acción de gracias'], ['Espíritu Santo', 'Por medio de Él actúa Jesús'], ['Nosotros', 'Somos su Cuerpo']] },
    { type: 'quiz', prompt: '¿Quién hace esta oración unido a nosotros?', options: ['Jesús', 'Solo el lector de las lecturas', 'Solo los que responden en voz alta'], answer: 'Jesús' },
  ],
  Consagración: [
    { type: 'quiz', prompt: '¿Qué ocurre en la Consagración?', options: ['El pan y el vino se transforman en el Cuerpo y la Sangre de Cristo', 'El pan y el vino se presentan pero no cambian', 'Se proclama el Evangelio y la homilía'], answer: 'El pan y el vino se transforman en el Cuerpo y la Sangre de Cristo' },
    { type: 'match', prompt: 'Relaciona.', pairs: [['Sacerdote', 'Dice las palabras de Jesús en su nombre'], ['Pan y vino', 'Se transforman'], ['Transustanciación', 'Nombre de este misterio']] },
    { type: 'order', prompt: 'Ordena.', steps: ['El sacerdote dice las palabras de Jesús', 'El pan y el vino se transforman', 'Jesús se hace realmente presente'] },
  ],
  'Santos y almas del purgatorio': [
    { type: 'quiz', prompt: '¿Con quién estamos unidos en la Misa?', options: ['Con toda la Iglesia', 'Solo con los fieles presentes en el templo', 'Solo con quienes leen las lecturas'], answer: 'Con toda la Iglesia' },
    { type: 'match', prompt: 'Relaciona.', pairs: [['Santos del cielo', 'Forman parte de la Iglesia'], ['Almas del purgatorio', 'También rezamos unidos a ellas'], ['Fieles en la tierra', 'Peregrinan en la tierra']] },
  ],
  'Padre nuestro': [
    { type: 'quiz', prompt: '¿Qué oración rezamos en este momento?', options: ['La oración que Jesús nos enseñó', 'La oración universal', 'La oración colecta'], answer: 'La oración que Jesús nos enseñó' },
    { type: 'match', prompt: 'Relaciona.', pairs: [['Padre nuestro', 'Oración que Jesús nos enseñó'], ['Pan de Vida', 'Lo recibimos preparados'], ['Hermanos', 'Nos unimos como familia']] },
    { type: 'order', prompt: 'Ordena.', steps: ['Rezamos el Padre nuestro', 'Nos preparamos para recibir el Pan de Vida', 'Vivimos unidos como hermanos'] },
  ],
  Comunión: [
    { type: 'quiz', prompt: '¿Qué recibimos en la Comunión?', options: ['El Pan de Vida', 'Solo una señal de amistad', 'Una lectura del Nuevo Testamento'], answer: 'El Pan de Vida' },
    { type: 'match', prompt: 'Relaciona.', pairs: [['Jesús en la Eucaristía', 'Alimento que da Vida eterna'], ['Pan de Vida', 'Jesús se entrega a nosotros'], ['Un solo Cuerpo', 'Nos une con los hermanos en la fe']] },
    { type: 'quiz', prompt: '¿Qué hace la Eucaristía con los hermanos en la fe?', options: ['Hace que formemos un solo Cuerpo', 'Hace que cada uno rece sin los demás', 'Sustituye la Liturgia de la Palabra'], answer: 'Hace que formemos un solo Cuerpo' },
  ],
  'Acción de gracias': [
    { type: 'quiz', prompt: '¿Qué hacemos después de recibir a Jesús?', options: ['Damos gracias', 'Volvemos a presentar las ofrendas', 'Repetimos la homilía'], answer: 'Damos gracias' },
    { type: 'match', prompt: 'Relaciona.', pairs: [['Eucaristía', 'Regalo por el que damos gracias'], ['Jesús', 'Se queda con nosotros'], ['Gracia', 'Ayuda que necesitamos para nuestra vida']] },
  ],
  'Oración y bendición final': [
    { type: 'quiz', prompt: '¿Qué encargo recibimos al terminar la Misa?', options: ['Llevar la Buena Noticia a todas las personas', 'Quedarnos solo con lo que hemos visto', 'Repetir de nuevo los ritos iniciales'], answer: 'Llevar la Buena Noticia a todas las personas' },
    { type: 'match', prompt: 'Relaciona.', pairs: [['Rito de despedida', 'Jesús nos envía'], ['Buena Noticia', 'El Evangelio'], ['Todas las personas', 'A quienes debemos anunciar']] },
    { type: 'order', prompt: 'Ordena.', steps: ['Termina la Misa', 'Recibimos el encargo', 'Llevamos la Buena Noticia'] },
  ],
};

const celebrationIntro = [
  'El domingo es el Día del Señor. En la Misa, Jesús sale a nuestro encuentro y nos reúne para celebrar su Pasión, Muerte y Resurrección.',
  'La Iglesia celebra la Misa cada día, pero el domingo es el día en que resucitó Jesús y todos nos reunimos para celebrarlo en el sacramento de la Eucaristía.',
  'La Misa tiene dos momentos principales, la Liturgia de la Palabra y la Liturgia Eucarística, con unos ritos iniciales y un rito de despedida.',
];

const cloneMisaData = () => misaData.map((section) => ({
  ...section,
  cards: section.cards.map((card) => ({ ...card })),
}));

const applyTextOverrides = (sections, textOverrides = {}) => sections.map((section) => ({
  ...section,
  cards: section.cards.map((card) => ({
    ...card,
    ...(textOverrides[card.title] || {}),
  })),
}));

const applyActivityOverrides = (sections, activityOverrides = {}) => sections.map((section) => ({
  ...section,
  cards: section.cards.map((card) => ({
    ...card,
    activities: activityOverrides[card.title] || cardActivities[card.title] || [],
  })),
}));

const applyImageOverrides = (sections, imageOverrides = {}) => sections.map((section) => ({
  ...section,
  cards: section.cards.map((card) => ({
    ...card,
    ...(imageOverrides[card.title] ? { image: imageOverrides[card.title], imageLabels: undefined } : {}),
  })),
}));

const getTextOverrides = (sections) => sections.reduce((overrides, section) => {
  section.cards.forEach((card) => {
    overrides[card.title] = { text: card.text, remember: card.remember };
  });
  return overrides;
}, {});

const getIntroText = (introOverrides) => introOverrides?.length ? introOverrides : celebrationIntro;

const readImageAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

const renderInlineFormatting = (text) => {
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  });
};

function FormattedText({ text }) {
  const lines = String(text || '').split('\n');
  const blocks = [];
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(<ul key={`list-${blocks.length}`}>{listItems.map((item, index) => <li key={index}>{renderInlineFormatting(item)}</li>)}</ul>);
    listItems = [];
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      flushList();
      return;
    }
    if (trimmedLine.startsWith('- ')) {
      listItems.push(trimmedLine.slice(2));
      return;
    }
    flushList();
    blocks.push(<p key={`p-${blocks.length}`}>{renderInlineFormatting(trimmedLine)}</p>);
  });
  flushList();

  return <div className="formatted-text">{blocks}</div>;
}

function FormatToolbar({ textareaRef, value, onChange }) {
  const applyFormat = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    let nextText = selected;
    let cursorStart = start;
    let cursorEnd = end;

    if (type === 'bold') {
      nextText = `**${selected || 'texto'}**`;
      cursorStart = start + 2;
      cursorEnd = start + nextText.length - 2;
    }
    if (type === 'italic') {
      nextText = `*${selected || 'texto'}*`;
      cursorStart = start + 1;
      cursorEnd = start + nextText.length - 1;
    }
    if (type === 'list') {
      nextText = selected
        ? selected.split('\n').map((line) => line.trim() ? `- ${line.replace(/^-\s*/, '')}` : line).join('\n')
        : '- primer punto\n- segundo punto';
      cursorStart = start;
      cursorEnd = start + nextText.length;
    }

    onChange(value.slice(0, start) + nextText + value.slice(end));
    window.setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorStart, cursorEnd);
    }, 0);
  };

  return (
    <div className="format-toolbar" aria-label="Formato de texto">
      <button type="button" onClick={() => applyFormat('bold')}><strong>N</strong></button>
      <button type="button" onClick={() => applyFormat('italic')}><em>C</em></button>
      <button type="button" onClick={() => applyFormat('list')}>Lista</button>
    </div>
  );
}

// --- Componentes ---

function PrayerModal({ prayerTitle, prayerLines, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X /></button>
        <h2 className="modal-title">{prayerTitle}</h2>
        <div className="prayer-text">
          {prayerLines.map((line, i) => (
            <p key={i} className={`prayer-line ${line.role ? `role-${line.role.toLowerCase()}` : 'role-all'}`}>
              {line.role && <strong className="prayer-role">{line.role}:</strong>} {line.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function PrologueModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content prologue-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X /></button>
        <h2 className="modal-title">Prólogo</h2>
        <div className="prologue-text">
          {prologue.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
      </div>
    </div>
  );
}

function AppInfoModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content prologue-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X /></button>
        <h2 className="modal-title">Más información</h2>
        <div className="prologue-text app-info-text">
          {appInfo.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
      </div>
    </div>
  );
}

function TeacherLoginModal({ firebaseEnabled, onClose, onGoogleLogin, onLocalLogin, onLogout, teacher, teacherAccessChecked, teacherAllowed }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (event) => {
    event.preventDefault();
    if (password === TEACHER_PASSWORD) {
      setError('');
      onLocalLogin();
      return;
    }
    setError('Contraseña incorrecta.');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content teacher-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X /></button>
        <p className="eyebrow">Modo profesor</p>
        <h2 className="modal-title">Acceso profesor</h2>
        {firebaseEnabled && !teacher && (
          <div className="teacher-login">
            <p>Entra con tu cuenta de Google para guardar tus clases y usarlas desde otros ordenadores.</p>
            <button className="primary-button" type="button" onClick={onGoogleLogin}>Entrar con Google</button>
          </div>
        )}
        {firebaseEnabled && teacher && !teacherAccessChecked && (
          <div className="teacher-login">
            <p>Comprobando permisos de profesor...</p>
          </div>
        )}
        {firebaseEnabled && teacher && teacherAccessChecked && !teacherAllowed && (
          <div className="teacher-login">
            <p className="teacher-error">Esta cuenta no tiene permiso de profesor.</p>
            <p>Has entrado como {teacher.email}. Pide al administrador que añada este correo a la lista de profesores autorizados.</p>
            <button className="secondary-button" type="button" onClick={onLogout}>Salir</button>
          </div>
        )}
        {!firebaseEnabled && (
          <form className="teacher-login" onSubmit={handleLogin}>
            <p>Firebase todavía no está configurado. Mientras tanto, este modo guarda los cambios solo en este navegador.</p>
            <label htmlFor="teacher-password">Contraseña</label>
            <input id="teacher-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus />
            {error && <p className="teacher-error">{error}</p>}
            <button className="primary-button" type="submit">Entrar</button>
          </form>
        )}
      </div>
    </div>
  );
}

const addUniqueName = (names, name) => names.includes(name) ? names : [...names, name];
const getUniqueNames = (text) => {
  const seenNames = new Set();
  return text
    .split(/\n|,|;/)
    .map((name) => name.trim())
    .filter(Boolean)
    .filter((name) => {
      const normalizedName = name.toLowerCase();
      if (seenNames.has(normalizedName)) return false;
      seenNames.add(normalizedName);
      return true;
    });
};

const teacherGameQuestions = [
  { id: 'church-1', part: 'Lugar de la celebración', card: 'La iglesia', prompt: '¿Por qué la iglesia es un lugar especial para los cristianos?', answer: 'Porque es la casa de Dios y allí celebramos la Eucaristía.' },
  { id: 'church-2', part: 'Lugar de la celebración', card: 'Elementos de la iglesia', prompt: '¿Para qué sirve el altar en la Misa?', answer: 'Es la mesa donde se celebra el sacrificio de Jesús.' },
  { id: 'church-3', part: 'Lugar de la celebración', card: 'Elementos de la iglesia', prompt: '¿Dónde se proclama la Palabra de Dios?', answer: 'En el ambón.' },
  { id: 'objects-1', part: 'Lugar de la celebración', card: 'Objetos litúrgicos', prompt: '¿Qué se pone en el cáliz?', answer: 'El vino que será la Sangre de Cristo.' },
  { id: 'objects-2', part: 'Lugar de la celebración', card: 'Objetos litúrgicos', prompt: '¿Por qué los objetos de la Misa se tratan con respeto?', answer: 'Porque se usan para celebrar la Eucaristía y algunos tocan el Cuerpo y la Sangre de Jesús.' },
  { id: 'objects-3', part: 'Lugar de la celebración', card: 'Sagrario', prompt: '¿Qué se guarda en el sagrario?', answer: 'El Pan consagrado, que es el Cuerpo de Jesús.' },
  { id: 'objects-4', part: 'Lugar de la celebración', card: 'Sagrario', prompt: '¿Qué nos recuerda la lámpara encendida junto al sagrario?', answer: 'Nos recuerda que Jesús está presente en el sagrario.' },
  { id: 'rites-1', part: 'Ritos iniciales', card: 'Inicio de la Misa', prompt: '¿Qué hacemos al empezar la Misa?', answer: 'Nos reunimos, saludamos al Señor y nos preparamos para celebrar.' },
  { id: 'rites-2', part: 'Ritos iniciales', card: 'Acto penitencial', prompt: '¿Qué pedimos a Dios en el acto penitencial?', answer: 'Le pedimos perdón por nuestros pecados.' },
  { id: 'rites-3', part: 'Ritos iniciales', card: 'Gloria', prompt: '¿Qué hacemos cuando rezamos o cantamos el Gloria?', answer: 'Alabamos a Dios con alegría.' },
  { id: 'word-1', part: 'Liturgia de la Palabra', card: 'Lecturas', prompt: '¿Quién nos habla en las lecturas de la Misa?', answer: 'Dios nos habla por su Palabra.' },
  { id: 'word-2', part: 'Liturgia de la Palabra', card: 'Evangelio', prompt: '¿Por qué escuchamos el Evangelio con atención?', answer: 'Porque en el Evangelio nos habla Jesús.' },
  { id: 'word-3', part: 'Liturgia de la Palabra', card: 'Homilía', prompt: '¿Para qué sirve la homilía?', answer: 'Para ayudarnos a entender la Palabra de Dios y vivirla.' },
  { id: 'word-4', part: 'Liturgia de la Palabra', card: 'Credo', prompt: '¿Qué decimos en el Credo?', answer: 'Decimos que creemos en Dios y proclamamos nuestra fe.' },
  { id: 'word-7', part: 'Liturgia de la Palabra', card: 'Oración universal', prompt: '¿Por quién rezamos en la oración universal?', answer: 'Rezamos por la Iglesia, por el mundo y por las necesidades de todos.' },
  { id: 'word-5', part: 'Liturgia de la Palabra', card: 'Emaús', prompt: '¿Qué hizo Jesús con los discípulos de Emaús?', answer: 'Les explicó las Escrituras y partió para ellos el pan.' },
  { id: 'word-6', part: 'Liturgia de la Palabra', card: 'Domingo', prompt: '¿Por qué el domingo es el Día del Señor?', answer: 'Porque celebramos que Jesús resucitó y nos encontramos con Él en la Eucaristía.' },
  { id: 'eucharist-1', part: 'Liturgia Eucarística', card: 'Ofrendas', prompt: '¿Qué se presenta en las ofrendas?', answer: 'El pan y el vino.' },
  { id: 'eucharist-2', part: 'Liturgia Eucarística', card: 'Plegaria Eucarística', prompt: '¿A quién damos gracias en la Plegaria Eucarística?', answer: 'A Dios Padre.' },
  { id: 'eucharist-3', part: 'Liturgia Eucarística', card: 'Consagración', prompt: '¿Qué ocurre en la consagración?', answer: 'El pan y el vino se transforman en el Cuerpo y la Sangre de Cristo.' },
  { id: 'eucharist-4', part: 'Liturgia Eucarística', card: 'Padre nuestro', prompt: '¿Qué oración rezamos antes de comulgar?', answer: 'El Padre nuestro.' },
  { id: 'eucharist-5', part: 'Liturgia Eucarística', card: 'Plegaria Eucarística', prompt: '¿Quién preside de verdad la celebración de la Eucaristía?', answer: 'Jesús, por medio del sacerdote.' },
  { id: 'eucharist-6', part: 'Liturgia Eucarística', card: 'Consagración', prompt: '¿Quién pronuncia las palabras de la consagración en la Misa?', answer: 'El sacerdote.' },
  { id: 'eucharist-7', part: 'Liturgia Eucarística', card: 'Consagración', prompt: '¿Qué decimos al final de la Plegaria Eucarística para unirnos a la oración?', answer: 'Decimos Amén.' },
  { id: 'eucharist-8', part: 'Liturgia Eucarística', card: 'Ofrendas', prompt: '¿De qué están hechos el pan y el vino que se consagran?', answer: 'El pan es de trigo y el vino es de uva.' },
  { id: 'communion-1', part: 'Liturgia Eucarística', card: 'Comunión', prompt: '¿A quién recibimos en la Comunión?', answer: 'Recibimos a Jesús.' },
  { id: 'communion-2', part: 'Liturgia Eucarística', card: 'Acción de gracias', prompt: '¿Qué hacemos después de recibir a Jesús?', answer: 'Damos gracias.' },
  { id: 'communion-3', part: 'Liturgia Eucarística', card: 'Comunión', prompt: '¿Qué necesitamos para recibir bien a Jesús en la Comunión?', answer: 'Estar en gracia de Dios y prepararnos con respeto.' },
  { id: 'vestments-1', part: 'Lugar de la celebración', card: 'Vestiduras', prompt: '¿Por qué el sacerdote lleva vestiduras especiales en la Misa?', answer: 'Porque representa a Jesús y celebra la Eucaristía.' },
  { id: 'vestments-2', part: 'Lugar de la celebración', card: 'Vestiduras', prompt: 'Di una vestidura que puede llevar el sacerdote en la Misa.', answer: 'Alba, cíngulo, estola o casulla.' },
  { id: 'vestments-3', part: 'Lugar de la celebración', card: 'Colores litúrgicos', prompt: '¿Qué color litúrgico se usa en el tiempo ordinario?', answer: 'El verde.' },
  { id: 'vestments-4', part: 'Lugar de la celebración', card: 'Colores litúrgicos', prompt: '¿Qué color litúrgico se usa en Navidad y Pascua?', answer: 'El blanco.' },
  { id: 'parts-1', part: 'La celebración de la Eucaristía', card: 'Partes de la Misa', prompt: '¿En qué parte de la Misa escuchamos la Palabra de Dios?', answer: 'En la Liturgia de la Palabra.' },
  { id: 'parts-2', part: 'La celebración de la Eucaristía', card: 'Partes de la Misa', prompt: '¿En qué parte de la Misa Jesús toma el pan y el vino?', answer: 'En la Liturgia Eucarística.' },
  { id: 'parts-3', part: 'La celebración de la Eucaristía', card: 'Partes de la Misa', prompt: '¿En qué parte de la Misa recibimos la bendición y somos enviados?', answer: 'En el rito de despedida.' },
  { id: 'general-1', part: 'La celebración de la Eucaristía', card: 'La Misa', prompt: '¿Qué es la Misa?', answer: 'Es la celebración de la Eucaristía, en la que Jesús se hace presente y se entrega por nosotros.' },
  { id: 'general-2', part: 'La celebración de la Eucaristía', card: 'Partes de la Misa', prompt: '¿Cuántas partes principales tiene la Misa?', answer: 'Tiene dos partes principales: Liturgia de la Palabra y Liturgia Eucarística.' },
  { id: 'general-3', part: 'La celebración de la Eucaristía', card: 'Partes de la Misa', prompt: '¿Cómo se llaman las dos partes más importantes de la Misa?', answer: 'Liturgia de la Palabra y Liturgia Eucarística.' },
  { id: 'general-4', part: 'La celebración de la Eucaristía', card: 'Domingo', prompt: '¿Por qué es importante asistir a Misa los domingos?', answer: 'Porque el domingo es el Día del Señor y nos encontramos con Jesús en la Eucaristía.' },
  { id: 'general-5', part: 'Ritos iniciales', card: 'Acto penitencial', prompt: '¿Para qué sirve el acto penitencial?', answer: 'Para pedir perdón a Dios y preparar el corazón para la Misa.' },
  { id: 'general-6', part: 'Ritos iniciales', card: 'Oración colecta', prompt: '¿Por qué se llama Oración colecta?', answer: 'Porque recoge la oración de todos y la presenta a Dios.' },
  { id: 'general-7', part: 'Liturgia de la Palabra', card: 'Evangelio', prompt: '¿Por qué escuchamos de pie el Evangelio?', answer: 'Porque escuchamos a Jesús con respeto y atención.' },
  { id: 'general-8', part: 'Liturgia Eucarística', card: 'Altar', prompt: '¿En qué lugar de la iglesia tiene lugar la Liturgia Eucarística?', answer: 'En el altar.' },
  { id: 'general-9', part: 'Liturgia Eucarística', card: 'Consagración', prompt: '¿Cuál es el momento más importante de la Misa?', answer: 'La consagración, cuando el pan y el vino se transforman en el Cuerpo y la Sangre de Cristo.' },
  { id: 'general-10', part: 'Liturgia Eucarística', card: 'Consagración', prompt: '¿Por qué nos ponemos de rodillas en la consagración?', answer: 'Para adorar a Jesús, que se hace presente en la Eucaristía.' },
  { id: 'general-11', part: 'Liturgia Eucarística', card: 'Rito de la paz', prompt: '¿Qué significa el gesto de darnos la paz?', answer: 'Significa que queremos vivir unidos, perdonarnos y estar en paz con los demás.' },
  { id: 'general-12', part: 'Liturgia Eucarística', card: 'Comunión', prompt: '¿Es obligatorio comulgar en Misa?', answer: 'No siempre; para comulgar hay que estar preparado y en gracia de Dios.' },
  { id: 'general-13', part: 'Rito de despedida', card: 'Acción de gracias', prompt: '¿Es bueno quedarse un rato al terminar la Misa?', answer: 'Sí, es bueno quedarse un rato para dar gracias a Jesús.' },
  { id: 'ending-1', part: 'Rito de despedida', card: 'Bendición final', prompt: '¿Qué recibimos al final de la Misa?', answer: 'La bendición.' },
  { id: 'ending-2', part: 'Rito de despedida', card: 'Envío', prompt: '¿Qué encargo recibimos al terminar la Misa?', answer: 'Llevar la Buena Noticia y vivir como cristianos.' },
];

const getTeacherGameQuestions = (questions) => questions?.length ? questions : teacherGameQuestions;

function TeacherGame({ canEditQuestions = false, closeLabel = 'Volver a Profesor', isStudent = false, onClose, onSaveQuestions, onSaveStudentList, questions: savedQuestions, studentList: savedStudentList }) {
  const [gameMode, setGameMode] = useState('class');
  const [studentText, setStudentText] = useState(savedStudentList?.join('\n') || '');
  const [showStudentSetup, setShowStudentSetup] = useState(false);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState('');
  const [questionSort, setQuestionSort] = useState({ field: 'part', direction: 'asc' });
  const [questionDrafts, setQuestionDrafts] = useState(() => getTeacherGameQuestions(savedQuestions));
  const [selectedStudent, setSelectedStudent] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isQuestionPending, setIsQuestionPending] = useState(false);
  const [usedStudents, setUsedStudents] = useState([]);
  const [correctStudents, setCorrectStudents] = useState([]);
  const [regularStudents, setRegularStudents] = useState([]);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [playerScores, setPlayerScores] = useState({});
  const [botScore, setBotScore] = useState({ correct: 0, regular: 0 });
  const [currentModePlayer, setCurrentModePlayer] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState('');
  const spinTimeoutRef = useRef(null);
  const questionTimeoutRef = useRef(null);
  const soundIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const questions = getTeacherGameQuestions(savedQuestions);
  const students = getUniqueNames(studentText);
  const availableStudents = students.filter((name) => !usedStudents.includes(name));
  const availableQuestions = questions.filter((q) => !usedQuestions.includes(q.id));
  const allQuestionsUsed = questions.length > 0 && usedQuestions.length >= questions.length;
  const editingQuestion = questionDrafts.find((question) => question.id === editingQuestionId);
  const partOptions = [...new Set([...teacherGameQuestions, ...questionDrafts].map((question) => question.part).filter(Boolean))];
  const cardOptions = [...new Set([...teacherGameQuestions, ...questionDrafts].map((question) => question.card).filter(Boolean))];
  const sortedQuestionDrafts = [...questionDrafts].sort((firstQuestion, secondQuestion) => {
    const firstValue = (firstQuestion[questionSort.field] || '').localeCompare(secondQuestion[questionSort.field] || '', 'es', { sensitivity: 'base' });
    return questionSort.direction === 'asc' ? firstValue : -firstValue;
  });

  useEffect(() => {
    setQuestionDrafts(getTeacherGameQuestions(savedQuestions));
  }, [savedQuestions]);

  useEffect(() => {
    setStudentText(savedStudentList?.join('\n') || '');
  }, [savedStudentList]);

  useEffect(() => () => {
    window.clearTimeout(spinTimeoutRef.current);
    window.clearTimeout(questionTimeoutRef.current);
    window.clearInterval(soundIntervalRef.current);
    audioContextRef.current?.close();
  }, []);

  const resetGameState = () => {
    setGameStarted(false);
    setUsedStudents([]);
    setCorrectStudents([]);
    setRegularStudents([]);
    setUsedQuestions([]);
    setPlayerScores({});
    setBotScore({ correct: 0, regular: 0 });
    setSelectedStudent('');
    setCurrentQuestion(null);
    setIsSpinning(false);
    setIsQuestionPending(false);
    setCurrentModePlayer('');
  };

  const changeGameMode = (mode) => {
    setGameMode(mode);
    resetGameState();
    if (isStudent && mode === 'bot') {
      setGameStarted(true);
      setCurrentModePlayer('_human');
    }
  };

  const addStudentPlayer = () => {
    const name = playerNameInput.trim();
    if (!name) return;
    const updated = addUniqueName(students, name);
    setStudentText(updated.join('\n'));
    setPlayerNameInput('');
    if (!gameStarted) {
      setGameStarted(true);
      setCurrentModePlayer(updated[0]);
    }
  };

  const startGame = () => {
    setGameStarted(true);
    if (gameMode === 'friends' && students.length > 0) {
      setCurrentModePlayer(students[0]);
    } else if (gameMode === 'bot') {
      setCurrentModePlayer('_human');
    }
  };

  const playSpinTick = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioContext = audioContextRef.current || new AudioContext();
    audioContextRef.current = audioContext;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = 520 + Math.random() * 260;
    gain.gain.setValueAtTime(0.035, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.055);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.055);
  };

  const startSpinSound = () => {
    playSpinTick();
    window.clearInterval(soundIntervalRef.current);
    soundIntervalRef.current = window.setInterval(playSpinTick, 95);
  };

  const stopSpinSound = () => {
    window.clearInterval(soundIntervalRef.current);
  };

  const spinStudent = () => {
    if (!availableStudents.length || !availableQuestions.length || isSpinning || isQuestionPending || currentQuestion) return;
    setIsSpinning(true);
    setIsQuestionPending(false);
    setCurrentQuestion(null);
    startSpinSound();
    const startedAt = Date.now();
    const spin = () => {
      setSelectedStudent(availableStudents[Math.floor(Math.random() * availableStudents.length)]);
      if (Date.now() - startedAt < 1800) {
        spinTimeoutRef.current = window.setTimeout(spin, 90);
        return;
      }
      const nextStudent = availableStudents[Math.floor(Math.random() * availableStudents.length)];
      stopSpinSound();
      setIsSpinning(false);
      setSelectedStudent(nextStudent);
      setUsedStudents((names) => addUniqueName(names, nextStudent));
      setIsQuestionPending(true);
      questionTimeoutRef.current = window.setTimeout(() => {
        const nextQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        setCurrentQuestion(nextQuestion);
        setUsedQuestions((ids) => addUniqueName(ids, nextQuestion.id));
        setIsQuestionPending(false);
      }, 2000);
    };
    spin();
  };

  const askQuestionForPlayer = (playerName) => {
    if (!availableQuestions.length) return;
    const nextQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    setCurrentQuestion(nextQuestion);
    setUsedQuestions((ids) => addUniqueName(ids, nextQuestion.id));
    setCurrentModePlayer(playerName);
  };

  const advanceToNextPlayer = () => {
    if (gameMode === 'friends') {
      if (!students.length) return;
      const currentIndex = currentModePlayer ? students.indexOf(currentModePlayer) : -1;
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % students.length;
      setCurrentModePlayer(students[nextIndex]);
    } else if (gameMode === 'bot') {
      setCurrentModePlayer(currentModePlayer === '_human' ? '_bot' : '_human');
    }
  };

  const gradeAnswer = (grade) => {
    if (gameMode === 'class') {
      if (!selectedStudent) return;
      if (grade === 'correct') setCorrectStudents((names) => addUniqueName(names, selectedStudent));
      if (grade === 'regular') setRegularStudents((names) => addUniqueName(names, selectedStudent));
      setCurrentQuestion(null);
      setIsQuestionPending(false);
      setSelectedStudent('');
    } else {
      const player = currentModePlayer;
      if (!player) return;
      if (grade === 'correct' || grade === 'regular') {
        if (player === '_bot') {
          setBotScore((prev) => ({ ...prev, [grade === 'correct' ? 'correct' : 'regular']: prev[grade === 'correct' ? 'correct' : 'regular'] + 1 }));
        } else {
          setPlayerScores((prev) => ({
            ...prev,
            [player]: {
              correct: (prev[player]?.correct || 0) + (grade === 'correct' ? 1 : 0),
              regular: (prev[player]?.regular || 0) + (grade === 'regular' ? 1 : 0),
            },
          }));
        }
      }
      setCurrentQuestion(null);
      advanceToNextPlayer();
    }
  };

  const botAutoAnswer = () => {
    const grade = Math.random() < 0.6 ? 'correct' : 'regular';
    setBotScore((prev) => ({ ...prev, [grade === 'correct' ? 'correct' : 'regular']: prev[grade === 'correct' ? 'correct' : 'regular'] + 1 }));
    setCurrentQuestion(null);
    setCurrentModePlayer('_human');
  };

  const saveStudentList = () => {
    const nextStudents = getUniqueNames(studentText);
    onSaveStudentList?.(nextStudents);
    setShowStudentSetup(false);
  };

  const saveQuestionDrafts = (nextQuestions) => {
    setQuestionDrafts(nextQuestions);
  };

  const persistQuestionDrafts = async () => {
    await onSaveQuestions?.(questionDrafts);
    setShowQuestionEditor(false);
  };

  const updateQuestion = (questionId, field, value) => {
    saveQuestionDrafts(questionDrafts.map((question) => question.id === questionId ? { ...question, [field]: value } : question));
  };

  const deleteQuestion = (questionId) => {
    saveQuestionDrafts(questionDrafts.filter((question) => question.id !== questionId));
  };

  const addQuestion = () => {
    const newQuestion = {
      id: `custom-${Date.now()}`,
      part: partOptions[0] || 'Juego',
      card: cardOptions[0] || 'Pregunta nueva',
      prompt: 'Escribe aquí la pregunta.',
      answer: 'Escribe aquí la respuesta orientativa.',
    };
    saveQuestionDrafts([...questionDrafts, newQuestion]);
    setEditingQuestionId(newQuestion.id);
  };

  const sortQuestionsBy = (field) => {
    setQuestionSort((currentSort) => ({
      field,
      direction: currentSort.field === field && currentSort.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getPlayerTotalScore = (playerName) => {
    const score = playerScores[playerName];
    return (score?.correct || 0) + (score?.regular || 0);
  };

  return (
    <div className="teacher-game">
      <div className="teacher-game-header">
        <div>
          <p className="eyebrow">Juego de clase</p>
          <h3>¿Conoces lo que pasa en Misa?</h3>
        </div>
        <div className="teacher-page-header-actions">
          {canEditQuestions && <button className="secondary-button" type="button" onClick={() => setShowQuestionEditor(true)}>Editar preguntas</button>}
          <button className="secondary-button" type="button" onClick={onClose}>{closeLabel}</button>
        </div>
      </div>
      <div className="game-mode-bar">
        <span className="game-mode-label">Modo de juego:</span>
        {!isStudent && <button className={gameMode === 'class' ? 'game-mode-btn active' : 'game-mode-btn'} type="button" onClick={() => changeGameMode('class')}>En clase</button>}
        <button className={gameMode === 'friends' ? 'game-mode-btn active' : 'game-mode-btn'} type="button" onClick={() => changeGameMode('friends')}>Con amigos</button>
        <button className={gameMode === 'bot' ? 'game-mode-btn active' : 'game-mode-btn'} type="button" onClick={() => changeGameMode('bot')}>Contra el bot</button>
        {gameMode !== 'class' && !isStudent && (
          <button className="student-list-btn" type="button" onClick={() => setShowStudentSetup(true)}>
            Lista de jugadores{students.length ? ` (${students.length})` : ''}
          </button>
        )}
        {gameMode !== 'class' && students.length > 0 && !gameStarted && !allQuestionsUsed && (
          <button className="primary-button" type="button" onClick={startGame}>Empezar a jugar</button>
        )}
      </div>
      <div className="teacher-game-setup-bar">
        {gameMode === 'class' && (
          <>
            <button className="secondary-button" type="button" onClick={() => setShowStudentSetup(true)}>Lista de alumnos {students.length ? `(${students.length})` : ''}</button>
            {students.length > 0 && !gameStarted && <button className="primary-button" type="button" onClick={startGame}>Empezar a jugar</button>}
          </>
        )}
        {gameStarted && (
          <>
            {!allQuestionsUsed && availableQuestions.length < questions.length && (
              <span className="game-used-count">{usedQuestions.length} de {questions.length} preguntas usadas</span>
            )}
            {allQuestionsUsed && (
              <span className="game-all-used">Todas las preguntas usadas</span>
            )}
            <button className="secondary-button" type="button" onClick={resetGameState}>Reiniciar juego</button>
          </>
        )}
      </div>
      {showStudentSetup && (
        <div className="modal-overlay" onClick={() => setShowStudentSetup(false)}>
          <section className="teacher-game-setup student-list-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setShowStudentSetup(false)}><X /></button>
            <label htmlFor="student-list">Lista de alumnos</label>
            <textarea id="student-list" value={studentText} onChange={(event) => setStudentText(event.target.value)} placeholder="Pega aquí los nombres, uno por línea o separados por comas" rows="9" autoFocus />
            <p>{students.length} alumnos preparados sin repetir. {questions.length} preguntas disponibles.</p>
            <button className="primary-button" type="button" onClick={saveStudentList} disabled={!students.length}>Guardar lista</button>
          </section>
        </div>
      )}
      {showQuestionEditor && (
        <div className="modal-overlay" onClick={() => setShowQuestionEditor(false)}>
          <section className="teacher-game-setup question-editor-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setShowQuestionEditor(false)}><X /></button>
            <div className="question-editor-header">
              <div>
                <p className="eyebrow">Juego de clase</p>
                <h3>Editar preguntas</h3>
              </div>
              <div className="teacher-page-header-actions">
                <button className="secondary-button" type="button" onClick={addQuestion}>Añadir pregunta</button>
                <button className="primary-button" type="button" onClick={persistQuestionDrafts}>Guardar cambios</button>
              </div>
            </div>
            <div className="question-table-wrap">
              <table className="question-editor-table">
                <thead>
                  <tr>
                    <th><button className="question-sort-button" type="button" onClick={() => sortQuestionsBy('part')}>Parte {questionSort.field === 'part' ? questionSort.direction === 'asc' ? '\u2191' : '\u2193' : ''}</button></th>
                    <th><button className="question-sort-button" type="button" onClick={() => sortQuestionsBy('card')}>Tema {questionSort.field === 'card' ? questionSort.direction === 'asc' ? '\u2191' : '\u2193' : ''}</button></th>
                    <th>Pregunta</th>
                    <th>Respuesta orientativa</th>
                    <th>Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedQuestionDrafts.map((question) => (
                    <tr key={question.id}>
                      <td>{question.part}</td>
                      <td>{question.card}</td>
                      <td>
                        <button className="question-row-button" type="button" onClick={() => setEditingQuestionId(question.id)}>{question.prompt}</button>
                      </td>
                      <td>{question.answer}</td>
                      <td>
                        <button className="trash-button" type="button" onClick={() => deleteQuestion(question.id)} aria-label="Eliminar pregunta"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
      {editingQuestion && (
        <div className="modal-overlay" onClick={() => setEditingQuestionId('')}>
          <section className="teacher-game-setup question-edit-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setEditingQuestionId('')}><X /></button>
            <p className="eyebrow">Editar pregunta</p>
            <label htmlFor="question-part">Parte</label>
            <select id="question-part" value={editingQuestion.part} onChange={(event) => updateQuestion(editingQuestion.id, 'part', event.target.value)}>
              {partOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <label htmlFor="question-card">Tema</label>
            <select id="question-card" value={editingQuestion.card} onChange={(event) => updateQuestion(editingQuestion.id, 'card', event.target.value)}>
              {cardOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <label htmlFor="question-prompt">Pregunta</label>
            <textarea id="question-prompt" value={editingQuestion.prompt} onChange={(event) => updateQuestion(editingQuestion.id, 'prompt', event.target.value)} rows="3" autoFocus />
            <label htmlFor="question-answer">Respuesta orientativa</label>
            <textarea id="question-answer" value={editingQuestion.answer} onChange={(event) => updateQuestion(editingQuestion.id, 'answer', event.target.value)} rows="3" />
            <button className="primary-button" type="button" onClick={() => setEditingQuestionId('')}>Aceptar</button>
          </section>
        </div>
      )}
      {gameMode === 'class' && gameStarted && (
        <div className="teacher-game-grid">
          <section className="teacher-game-stage">
            {!students.length && <p className="game-empty">Pulsa Lista de alumnos para pegar los nombres.</p>}
            {students.length > 0 && availableStudents.length === 0 && !isSpinning && (
              <p className="game-empty">Ya han salido todos los alumnos. Pulsa Reiniciar juego para empezar otra ronda.</p>
            )}
            {students.length > 0 && availableQuestions.length === 0 && usedQuestions.length > 0 && (
              <p className="game-empty">Todas las preguntas se han usado. Pulsa Reiniciar juego para empezar otra ronda.</p>
            )}
            <p className="game-empty">{students.length ? `${students.length} alumnos cargados. ${availableStudents.length} quedan por salir.` : ''}</p>
            <div className={isSpinning ? 'roulette-name spinning' : 'roulette-name'}>{selectedStudent || (students.length ? 'Pulsa la ruleta' : '')}</div>
            <button className="primary-button spin-button" type="button" onClick={spinStudent} disabled={!availableStudents.length || !availableQuestions.length || isSpinning || isQuestionPending || Boolean(currentQuestion)}>
              {isSpinning ? 'Girando...' : isQuestionPending ? 'Preparando pregunta...' : (!availableStudents.length || allQuestionsUsed) ? 'Reiniciar para jugar' : availableStudents.length ? 'Girar ruleta' : 'Ya han salido todos'}
            </button>
            <p className="game-empty">Al detenerse la ruleta aparecerá una pregunta en el centro de la pantalla.</p>
          </section>
          <div className="game-results">
            <section>
              <h4>Correctas</h4>
              {correctStudents.length ? <ul>{correctStudents.map((name) => <li key={name}>{name}</li>)}</ul> : <p>Todavía no hay alumnos.</p>}
            </section>
            <section>
              <h4>Regulares</h4>
              {regularStudents.length ? <ul>{regularStudents.map((name) => <li key={name}>{name}</li>)}</ul> : <p>Todavía no hay alumnos.</p>}
            </section>
          </div>
        </div>
      )}
      {gameMode === 'friends' && gameStarted && (
        <div className="teacher-game-grid">
          <section className="teacher-game-stage">
            {!students.length && isStudent && (
              <div className="player-select-area">
                <p className="game-empty">Añade un jugador para empezar</p>
                <div className="inline-player-input">
                  <input value={playerNameInput} onChange={(e) => setPlayerNameInput(e.target.value)} placeholder="Nombre del jugador" onKeyDown={(e) => e.key === 'Enter' && addStudentPlayer()} />
                  <button className="primary-button" type="button" onClick={addStudentPlayer}>Añadir</button>
                </div>
              </div>
            )}
            {!students.length && !isStudent && <p className="game-empty">Añade alumnos desde Lista de alumnos.</p>}
            {students.length > 0 && allQuestionsUsed && <p className="game-empty">Todas las preguntas se han usado. Pulsa Reiniciar juego.</p>}
            {students.length > 0 && !allQuestionsUsed && currentModePlayer && !currentQuestion && (
              <div className="player-select-area">
                <p className="game-empty">Turno de: <strong>{currentModePlayer}</strong></p>
                <button className="primary-button" type="button" onClick={() => askQuestionForPlayer(currentModePlayer)} disabled={!availableQuestions.length}>
                  Preguntar
                </button>
                <button className="secondary-button" type="button" onClick={() => {
                  const currentIndex = students.indexOf(currentModePlayer);
                  const nextIndex = (currentIndex + 1) % students.length;
                  setCurrentModePlayer(students[nextIndex]);
                }}>Saltar jugador</button>
              </div>
            )}
          </section>
          <div className="game-results">
            {students.map((name) => {
              const score = playerScores[name];
              return (
                <section key={name} className={'player-result-card' + (currentModePlayer === name ? ' active' : '')}>
                  <h4>{name}</h4>
                  <p>Correctas: {score?.correct || 0}</p>
                  <p>Regulares: {score?.regular || 0}</p>
                  <p>Total: {(score?.correct || 0) + (score?.regular || 0)}</p>
                </section>
              );
            })}
          </div>
        </div>
      )}
      {gameMode === 'bot' && gameStarted && (
        <div className="teacher-game-grid">
          <section className="teacher-game-stage">
            {!students.length && !isStudent && <p className="game-empty">Añade alumnos desde Lista de alumnos.</p>}
            {students.length > 0 && allQuestionsUsed && <p className="game-empty">Todas las preguntas se han usado. Pulsa Reiniciar juego.</p>}
            {students.length > 0 && !allQuestionsUsed && currentModePlayer && !currentQuestion && (
              <div className="player-select-area">
                <p className="game-empty">Turno de: <strong>{currentModePlayer === '_bot' ? 'Bot' : 'Jugador'}</strong></p>
                <button className="primary-button" type="button" onClick={() => {
                  if (currentModePlayer === '_bot') {
                    const nextQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
                    if (!nextQuestion) return;
                    setCurrentQuestion(nextQuestion);
                    setUsedQuestions((ids) => addUniqueName(ids, nextQuestion.id));
                  } else {
                    askQuestionForPlayer('_human');
                  }
                }} disabled={!availableQuestions.length}>
                  Preguntar
                </button>
              </div>
            )}
            {currentModePlayer === '_bot' && currentQuestion && (
              <div className="question-auto-area">
                <p className="game-empty">Bot respondiendo...</p>
              </div>
            )}
          </section>
          <div className="game-results">
            <section className={'player-result-card' + (currentModePlayer === '_human' ? ' active' : '')}>
              <h4>Jugador</h4>
              <p>Correctas: {playerScores['_human']?.correct || 0}</p>
              <p>Regulares: {playerScores['_human']?.regular || 0}</p>
              <p>Total: {(playerScores['_human']?.correct || 0) + (playerScores['_human']?.regular || 0)}</p>
            </section>
            <section className={'player-result-card' + (currentModePlayer === '_bot' ? ' active' : '')}>
              <h4>Bot</h4>
              <p>Correctas: {botScore.correct}</p>
              <p>Regulares: {botScore.regular}</p>
              <p>Total: {botScore.correct + botScore.regular}</p>
            </section>
          </div>
        </div>
      )}
      {currentQuestion && gameMode === 'friends' && (
        <div className="modal-overlay game-question-overlay" onClick={() => {
          if (currentModePlayer !== '_bot') return;
          botAutoAnswer();
        }}>
          <div className="game-question-card game-question-modal" onClick={e => e.stopPropagation()}>
            <p className="eyebrow">{currentModePlayer} · {currentQuestion.part} · {currentQuestion.card}</p>
            <h4>{currentQuestion.prompt}</h4>
            {currentQuestion.answer && (
              <details className="game-answer">
                <summary>Ver respuesta orientativa</summary>
                <p>{currentQuestion.answer}</p>
              </details>
            )}
            <div className="game-grade-actions">
              <button className="primary-button correct" type="button" onClick={() => gradeAnswer('correct')}>Correcta</button>
              <button className="secondary-button regular" type="button" onClick={() => gradeAnswer('regular')}>Regular</button>
              <button className="secondary-button wrong" type="button" onClick={() => gradeAnswer('wrong')}>Incorrecta</button>
            </div>
          </div>
        </div>
      )}
      {currentQuestion && gameMode === 'bot' && currentModePlayer !== '_bot' && (
        <div className="modal-overlay game-question-overlay">
          <div className="game-question-card game-question-modal" onClick={e => e.stopPropagation()}>
            <p className="eyebrow">Jugador · {currentQuestion.part} · {currentQuestion.card}</p>
            <h4>{currentQuestion.prompt}</h4>
            {currentQuestion.answer && (
              <details className="game-answer">
                <summary>Ver respuesta orientativa</summary>
                <p>{currentQuestion.answer}</p>
              </details>
            )}
            <div className="game-grade-actions">
              <button className="primary-button correct" type="button" onClick={() => gradeAnswer('correct')}>Correcta</button>
              <button className="secondary-button regular" type="button" onClick={() => gradeAnswer('regular')}>Regular</button>
              <button className="secondary-button wrong" type="button" onClick={() => gradeAnswer('wrong')}>Incorrecta</button>
            </div>
          </div>
        </div>
      )}
      {currentQuestion && gameMode === 'bot' && currentModePlayer === '_bot' && (
        <div className="modal-overlay game-question-overlay">
          <div className="game-question-card game-question-modal" onClick={e => e.stopPropagation()}>
            <p className="eyebrow">Bot · {currentQuestion.part} · {currentQuestion.card}</p>
            <h4>{currentQuestion.prompt}</h4>
            {currentQuestion.answer && (
              <details className="game-answer">
                <summary>Ver respuesta orientativa</summary>
                <p>{currentQuestion.answer}</p>
              </details>
            )}
            <div className="game-grade-actions">
              <button className="primary-button correct" type="button" onClick={botAutoAnswer}>El bot responde</button>
            </div>
          </div>
        </div>
      )}
      {currentQuestion && gameMode === 'class' && (
        <div className="modal-overlay game-question-overlay">
          <div className="game-question-card game-question-modal" onClick={e => e.stopPropagation()}>
            <p className="eyebrow">{selectedStudent} · {currentQuestion.part} · {currentQuestion.card}</p>
            <h4>{currentQuestion.prompt}</h4>
            {currentQuestion.answer && (
              <details className="game-answer">
                <summary>Ver respuesta orientativa</summary>
                <p>{currentQuestion.answer}</p>
              </details>
            )}
            <div className="game-grade-actions">
              <button className="primary-button correct" type="button" onClick={() => gradeAnswer('correct')}>Correcta</button>
              <button className="secondary-button regular" type="button" onClick={() => gradeAnswer('regular')}>Regular</button>
              <button className="secondary-button wrong" type="button" onClick={() => gradeAnswer('wrong')}>Incorrecta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherPage({
  activeClass,
  classes,
  editableSections,
  firebaseEnabled,
  gameQuestions,
  imageOverrides,
  introText,
  isSaving,
  gameVisible,
  lockedSections,
  onClose,
  onCreateClass,
  onLockAll,
  onLogout,
  onAddTeacherEmail,
  onSaveActivities,
  onSaveGameQuestions,
  onSaveImage,
  onSaveStudentList,
  onToggleGameVisible,
  onSaveIntro,
  onSaveText,
  onSelectClass,
  onToggleSection,
  onUnlockAll,
  teacher,
  teacherAllowed,
  studentList,
}) {
  const [className, setClassName] = useState('');
  const [editingCard, setEditingCard] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingRemember, setEditingRemember] = useState('');
  const [editingIntro, setEditingIntro] = useState(null);
  const [editingImageCard, setEditingImageCard] = useState(null);
  const [editingActivitiesCard, setEditingActivitiesCard] = useState(null);
  const [editingActivities, setEditingActivities] = useState([]);
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [teacherEmailMessage, setTeacherEmailMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [showTeacherGame, setShowTeacherGame] = useState(false);
  const textTextareaRef = useRef(null);
  const rememberTextareaRef = useRef(null);
  const introTextareaRef = useRef(null);
  const textEditorRef = useRef(null);
  const introEditorRef = useRef(null);
  const needsClass = firebaseEnabled && !activeClass;
  const classLink = activeClass ? `${window.location.origin}${BASE_URL}?class=${activeClass.id}` : '';
  const imageCard = editingImageCard
    ? editableSections.flatMap((section) => section.cards).find((card) => card.title === editingImageCard)
    : null;
  const originalImage = editingImageCard
    ? misaData.flatMap((section) => section.cards).find((card) => card.title === editingImageCard)?.image
    : '';

  const handleCreateClass = async (event) => {
    event.preventDefault();
    if (!className.trim()) return;
    setActionError('');
    setIsCreatingClass(true);
    try {
      await onCreateClass(className.trim());
      setClassName('');
    } catch (error) {
      setActionError(error.message || 'No se ha podido crear la clase.');
    } finally {
      setIsCreatingClass(false);
    }
  };

  const startEditing = (card) => {
    setEditingCard(card.title);
    setEditingText(card.text);
    setEditingRemember(card.remember);
  };

  const saveEditing = async () => {
    await onSaveText(editingCard, editingText, editingRemember);
    setEditingCard(null);
  };

  const startEditingIntro = () => {
    setEditingIntro(introText.join('\n\n'));
  };

  const saveIntro = async () => {
    const nextIntro = editingIntro.split('\n').map((line) => line.trim()).filter(Boolean);
    await onSaveIntro(nextIntro);
    setEditingIntro(null);
  };

  const startEditingActivities = (card) => {
    setEditingActivitiesCard(card.title);
    setEditingActivities((card.activities || []).map((activity) => ({ ...activity })));
  };

  const saveActivities = async () => {
    setActionError('');
    try {
      await onSaveActivities(editingActivitiesCard, editingActivities);
      setEditingActivitiesCard(null);
    } catch (error) {
      setActionError(error.message || 'No se han podido guardar las actividades.');
    }
  };

  const uploadImage = async (cardTitle, file) => {
    if (!file) return;
    setActionError('');
    try {
      const imageDataUrl = await readImageAsDataUrl(file);
      await onSaveImage(cardTitle, imageDataUrl);
    } catch (error) {
      setActionError(error.message || 'No se ha podido subir la imagen.');
    }
  };

  const createActivity = (type) => {
    if (type === 'match') return { type: 'match', prompt: 'Relaciona.', pairs: [['', '']] };
    if (type === 'order') return { type: 'order', prompt: 'Ordena.', steps: [''] };
    return { type: 'quiz', prompt: 'Pregunta.', options: ['', '', ''], answer: '' };
  };

  const updateActivity = (activityIndex, nextActivity) => {
    setEditingActivities(editingActivities.map((activity, index) => index === activityIndex ? nextActivity : activity));
  };

  const removeActivity = (activityIndex) => {
    setEditingActivities(editingActivities.filter((_, index) => index !== activityIndex));
  };

  const updateActivityType = (activityIndex, type) => {
    updateActivity(activityIndex, createActivity(type));
  };

  const updateArrayItem = (items, itemIndex, value) => items.map((item, index) => index === itemIndex ? value : item);

  const updatePair = (pairs, pairIndex, sideIndex, value) => pairs.map((pair, index) => (
    index === pairIndex ? pair.map((side, sidePosition) => sidePosition === sideIndex ? value : side) : pair
  ));

  const addTeacherEmail = async (event) => {
    event.preventDefault();
    if (!newTeacherEmail.trim()) return;
    setActionError('');
    try {
      await onAddTeacherEmail(newTeacherEmail.trim());
      setTeacherEmailMessage(`${newTeacherEmail.trim()} ya puede entrar como profesor.`);
      setNewTeacherEmail('');
    } catch (error) {
      setActionError(error.message || 'No se ha podido añadir el profesor.');
    }
  };

  useEffect(() => {
    if (!editingCard) return;
    window.setTimeout(() => {
      textEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      textTextareaRef.current?.focus();
      const textLength = textTextareaRef.current?.value.length || 0;
      textTextareaRef.current?.setSelectionRange(textLength, textLength);
    }, 0);
  }, [editingCard]);

  useEffect(() => {
    if (editingIntro === null) return;
    window.setTimeout(() => {
      introEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      introTextareaRef.current?.focus();
      const textLength = introTextareaRef.current?.value.length || 0;
      introTextareaRef.current?.setSelectionRange(textLength, textLength);
    }, 0);
  }, [editingIntro]);

  return (
    <main className="teacher-page">
      <div className="teacher-page-shell">
        <div className="teacher-page-header">
          <div>
            <p className="eyebrow">Modo profesor</p>
            <h2>Acceso profesor</h2>
          </div>
          <div className="teacher-page-header-actions">
            <button className="primary-button" type="button" onClick={() => setShowTeacherGame(true)}>Juego</button>
            <button className="secondary-button" type="button" onClick={onToggleGameVisible} disabled={needsClass}>
              {gameVisible ? 'Ocultar Juego a alumnos' : 'Mostrar Juego a alumnos'}
            </button>
            <button className="secondary-button" type="button" onClick={onClose}>Volver</button>
          </div>
        </div>
        {showTeacherGame ? (
          <TeacherGame canEditQuestions onClose={() => setShowTeacherGame(false)} onSaveQuestions={onSaveGameQuestions} onSaveStudentList={onSaveStudentList} questions={gameQuestions} studentList={studentList} />
        ) : (
          <>
        <details className="teacher-guide">
          <summary>
            <span><BookOpen size={18} /> Guía para el profesor</span>
            <ChevronDown className="teacher-guide-icon" size={18} />
          </summary>
          <div className="teacher-guide-content">
            {teacherGuide.map((section) => (
              <section className="teacher-guide-section" key={section.title}>
                <h3>{section.title}</h3>
                {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items && (
                  <ul>
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </details>
        <div className="teacher-panel">
          {teacher && (
            <div className="teacher-user-row">
              <span>{teacher.displayName || teacher.email}</span>
              <button className="secondary-button" type="button" onClick={onLogout}>Salir</button>
            </div>
          )}
          {firebaseEnabled && (
            <>
              <form className="teacher-class-form" onSubmit={addTeacherEmail}>
                <input value={newTeacherEmail} onChange={(event) => setNewTeacherEmail(event.target.value)} placeholder="Correo de otro profesor" type="email" />
                <button className="primary-button" type="submit">Añadir profesor</button>
              </form>
              {teacherEmailMessage && <p className="teacher-success">{teacherEmailMessage}</p>}
              <form className="teacher-class-form" onSubmit={handleCreateClass}>
                <input value={className} onChange={(event) => setClassName(event.target.value)} placeholder="Nueva clase, por ejemplo 4ºA" />
                <button className="primary-button" type="submit" disabled={isCreatingClass}>{isCreatingClass ? 'Creando...' : 'Crear clase'}</button>
              </form>
              {actionError && <p className="teacher-error">{actionError}</p>}
              <div className="teacher-class-list">
                {classes.map((classItem) => (
                    <button className={activeClass?.id === classItem.id ? 'teacher-class active' : 'teacher-class'} key={classItem.id} type="button" onClick={() => onSelectClass(classItem.id)}>
                      {classItem.name}
                    </button>
                  ))}
                </div>
                {activeClass && (
                  <div className="teacher-share-link">
                    <strong>Enlace para alumnos</strong>
                    <input readOnly value={classLink} onFocus={(event) => event.target.select()} />
                  </div>
                )}
                {!activeClass && <p className="teacher-error">Crea o selecciona una clase para guardar cambios.</p>}
              </>
            )}
            <p>Elige qué partes de la Misa podrán abrir los alumnos.</p>
            <div className="teacher-actions">
              <button className="secondary-button" type="button" onClick={onUnlockAll} disabled={needsClass}>Desbloquear todo</button>
              <button className="secondary-button" type="button" onClick={onLockAll} disabled={needsClass}>Bloquear todo</button>
            </div>
            <div className="teacher-section-list">
              {misaData.map((section) => {
                const isLocked = lockedSections.includes(section.id);
                const partNumber = section.id === -1 ? 0 : section.id + 1;
                return (
                  <button className={isLocked ? 'teacher-section locked' : 'teacher-section'} type="button" key={section.id} onClick={() => onToggleSection(section.id)} disabled={needsClass}>
                    <span>Parte {partNumber}. {section.title}</span>
                    <strong>{isLocked ? 'Bloqueada' : 'Desbloqueada'}</strong>
                  </button>
                );
              })}
            </div>
            <div className="teacher-text-editor">
              <h3>Editar textos</h3>
              <div className="teacher-edit-section">
                <strong>La celebración de la Eucaristía</strong>
                <div className="teacher-edit-card">
                  <span>Texto introductorio</span>
                  <div className="teacher-edit-actions">
                    <button className="secondary-button" type="button" onClick={startEditingIntro} disabled={needsClass}>Editar texto</button>
                  </div>
                </div>
              </div>
              {editableSections.map((section) => (
                <div className="teacher-edit-section" key={section.id}>
                  <strong>{section.title}</strong>
                  {section.cards.map((card) => (
                    <div className="teacher-edit-card" key={card.title}>
                      <span>{card.title}</span>
                      <div className="teacher-edit-actions">
                        <button className="secondary-button" type="button" onClick={() => startEditing(card)} disabled={needsClass}>Editar texto</button>
                        <button className="secondary-button" type="button" onClick={() => startEditingActivities(card)} disabled={needsClass}>Editar actividades</button>
                        <button className="secondary-button" type="button" onClick={() => setEditingImageCard(card.title)} disabled={needsClass}>Editar imagen</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {editingCard && (
              <div className="teacher-inline-editor" ref={textEditorRef}>
                <h3>{editingCard}</h3>
                <label>Texto principal</label>
                <FormatToolbar textareaRef={textTextareaRef} value={editingText} onChange={setEditingText} />
                <textarea ref={textTextareaRef} value={editingText} onChange={(event) => setEditingText(event.target.value)} rows="5" />
                <label>Recuerda</label>
                <FormatToolbar textareaRef={rememberTextareaRef} value={editingRemember} onChange={setEditingRemember} />
                <textarea ref={rememberTextareaRef} value={editingRemember} onChange={(event) => setEditingRemember(event.target.value)} rows="3" />
                <div className="teacher-actions">
                  <button className="primary-button" type="button" onClick={saveEditing} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar texto'}</button>
                  <button className="secondary-button" type="button" onClick={() => setEditingCard(null)}>Cancelar</button>
                </div>
              </div>
            )}
            {editingIntro !== null && (
              <div className="teacher-inline-editor" ref={introEditorRef}>
                <h3>La celebración de la Eucaristía</h3>
                <label>Texto introductorio</label>
                <FormatToolbar textareaRef={introTextareaRef} value={editingIntro} onChange={setEditingIntro} />
                <textarea ref={introTextareaRef} value={editingIntro} onChange={(event) => setEditingIntro(event.target.value)} rows="8" />
                <div className="teacher-actions">
                  <button className="primary-button" type="button" onClick={saveIntro} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar texto'}</button>
                  <button className="secondary-button" type="button" onClick={() => setEditingIntro(null)}>Cancelar</button>
                </div>
              </div>
            )}
            {imageCard && (
              <div className="modal-overlay" onClick={() => setEditingImageCard(null)}>
                <div className="teacher-game-setup image-editor-modal" onClick={e => e.stopPropagation()}>
                  <button className="modal-close" type="button" onClick={() => setEditingImageCard(null)}><X /></button>
                  <p className="eyebrow">Editar imagen</p>
                  <h3>{imageCard.title}</h3>
                  <img className="image-editor-preview" src={imageCard.image || originalImage} alt={imageCard.title} />
                  <div className="teacher-actions">
                    <label className="secondary-button image-upload-button">
                      Reemplazar imagen
                      <input accept="image/*" type="file" onChange={(event) => { uploadImage(imageCard.title, event.target.files?.[0]); event.target.value = ''; }} />
                    </label>
                    {imageOverrides[imageCard.title] ? (
                      <button className="secondary-button" type="button" onClick={() => onSaveImage(imageCard.title, '')}>Eliminar imagen subida</button>
                    ) : (
                      <span className="original-image-note">Mostrando imagen original. La imagen original no se puede eliminar.</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            {editingActivitiesCard && (
              <div className="teacher-inline-editor">
                <h3>Actividades: {editingActivitiesCard}</h3>
                <p>Edita las actividades con campos. Puedes añadir, eliminar o cambiar el tipo.</p>
                <div className="activity-editor-list">
                  {editingActivities.map((activity, activityIndex) => (
                    <div className="activity-editor-card" key={activityIndex}>
                      <div className="activity-editor-top">
                        <strong>Actividad {activityIndex + 1}</strong>
                        <select value={activity.type} onChange={(event) => updateActivityType(activityIndex, event.target.value)}>
                          <option value="quiz">Elige</option>
                          <option value="match">Relaciona</option>
                          <option value="order">Ordena</option>
                        </select>
                        <button className="secondary-button" type="button" onClick={() => removeActivity(activityIndex)}>Eliminar</button>
                      </div>
                      <label>Enunciado</label>
                      <input value={activity.prompt || ''} onChange={(event) => updateActivity(activityIndex, { ...activity, prompt: event.target.value })} />
                      {activity.type === 'quiz' && (
                        <div className="activity-editor-group">
                          <label>Opciones</label>
                          {(activity.options || []).map((option, optionIndex) => (
                            <div className="activity-editor-row" key={optionIndex}>
                              <input value={option} onChange={(event) => updateActivity(activityIndex, { ...activity, options: updateArrayItem(activity.options || [], optionIndex, event.target.value) })} />
                              <button className="secondary-button" type="button" onClick={() => updateActivity(activityIndex, { ...activity, options: (activity.options || []).filter((_, index) => index !== optionIndex) })}>Quitar</button>
                            </div>
                          ))}
                          <button className="secondary-button" type="button" onClick={() => updateActivity(activityIndex, { ...activity, options: [...(activity.options || []), ''] })}>Añadir opción</button>
                          <label>Respuesta correcta</label>
                          <input value={activity.answer || ''} onChange={(event) => updateActivity(activityIndex, { ...activity, answer: event.target.value })} />
                        </div>
                      )}
                      {activity.type === 'match' && (
                        <div className="activity-editor-group">
                          <label>Parejas</label>
                          {(activity.pairs || []).map((pair, pairIndex) => (
                            <div className="activity-editor-row pair" key={pairIndex}>
                              <input placeholder="Concepto" value={pair[0] || ''} onChange={(event) => updateActivity(activityIndex, { ...activity, pairs: updatePair(activity.pairs || [], pairIndex, 0, event.target.value) })} />
                              <input placeholder="Respuesta" value={pair[1] || ''} onChange={(event) => updateActivity(activityIndex, { ...activity, pairs: updatePair(activity.pairs || [], pairIndex, 1, event.target.value) })} />
                              <button className="secondary-button" type="button" onClick={() => updateActivity(activityIndex, { ...activity, pairs: (activity.pairs || []).filter((_, index) => index !== pairIndex) })}>Quitar</button>
                            </div>
                          ))}
                          <button className="secondary-button" type="button" onClick={() => updateActivity(activityIndex, { ...activity, pairs: [...(activity.pairs || []), ['', '']] })}>Añadir pareja</button>
                        </div>
                      )}
                      {activity.type === 'order' && (
                        <div className="activity-editor-group">
                          <label>Pasos en orden correcto</label>
                          {(activity.steps || []).map((step, stepIndex) => (
                            <div className="activity-editor-row" key={stepIndex}>
                              <input value={step} onChange={(event) => updateActivity(activityIndex, { ...activity, steps: updateArrayItem(activity.steps || [], stepIndex, event.target.value) })} />
                              <button className="secondary-button" type="button" onClick={() => updateActivity(activityIndex, { ...activity, steps: (activity.steps || []).filter((_, index) => index !== stepIndex) })}>Quitar</button>
                            </div>
                          ))}
                          <button className="secondary-button" type="button" onClick={() => updateActivity(activityIndex, { ...activity, steps: [...(activity.steps || []), ''] })}>Añadir paso</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="teacher-actions compact-actions">
                  <button className="secondary-button" type="button" onClick={() => setEditingActivities([...editingActivities, createActivity('quiz')])}>Añadir elige</button>
                  <button className="secondary-button" type="button" onClick={() => setEditingActivities([...editingActivities, createActivity('match')])}>Añadir relaciona</button>
                  <button className="secondary-button" type="button" onClick={() => setEditingActivities([...editingActivities, createActivity('order')])}>Añadir ordena</button>
                </div>
                <div className="teacher-actions">
                  <button className="primary-button" type="button" onClick={saveActivities} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar actividades'}</button>
                  <button className="secondary-button" type="button" onClick={() => setEditingActivitiesCard(null)}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
          </>
        )}
      </div>
    </main>
  );
}

function CardActivities({ card }) {
  const [answers, setAnswers] = useState({});
  const [orderAnswers, setOrderAnswers] = useState({});
  const [draggedMeaning, setDraggedMeaning] = useState('');
  const activities = card.activities || cardActivities[card.title] || [];

  if (!activities.length) return null;

  const setAnswer = (activityIndex, value) => {
    setAnswers({ ...answers, [activityIndex]: value });
  };

  const chooseStep = (activityIndex, step) => {
    const current = orderAnswers[activityIndex] || [];
    if (current.includes(step)) return;
    setOrderAnswers({ ...orderAnswers, [activityIndex]: [...current, step] });
  };

  const resetOrder = (activityIndex) => {
    setOrderAnswers({ ...orderAnswers, [activityIndex]: [] });
  };

  return (
    <div className="section-activities card-specific-activities">
      {activities.map((activity, index) => {
        if (activity.type === 'quiz') {
          const selected = answers[index];
          return (
            <div className="mini-activity" key={`${card.title}-${index}`}>
              <div className="mini-heading"><HelpCircle size={20} /> <strong>Actividad {index + 1}: elige</strong></div>
              <p>{activity.prompt}</p>
              <div className="answer-grid">
                {activity.options.map((option) => (
                  <button className={'answer ' + (selected === option && option === activity.answer ? 'correct' : selected === option ? 'wrong' : '')} key={option} onClick={() => setAnswer(index, option)}>{option}</button>
                ))}
              </div>
            </div>
          );
        }

        if (activity.type === 'match') {
          const meanings = activity.pairs.map((pair) => pair[1]).reverse();
          return (
            <div className="mini-activity" key={`${card.title}-${index}`}>
              <div className="mini-heading"><CheckCircle2 size={20} /> <strong>Actividad {index + 1}: relaciona</strong></div>
              <p>{activity.prompt} Arrastra cada respuesta a su lugar o toca una respuesta y luego su hueco.</p>
              <div className="drag-options">
                {meanings.map((option) => (
                  <button
                    className={'answer draggable-answer ' + (draggedMeaning === option ? 'selected' : '')}
                    draggable
                    key={option}
                    onClick={() => setDraggedMeaning(option)}
                    onDragStart={() => setDraggedMeaning(option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="match-list">
                {activity.pairs.map(([term, meaning], pairIndex) => {
                  const selected = answers[`match-${index}-${pairIndex}`];
                  return (
                  <div className="match-row" key={term}>
                    <span>{term}</span>
                    <div
                      className={'drop-zone ' + (selected && selected === meaning ? 'correct' : selected ? 'wrong' : '')}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => setAnswers({ ...answers, [`match-${index}-${pairIndex}`]: draggedMeaning })}
                      onClick={() => draggedMeaning && setAnswers({ ...answers, [`match-${index}-${pairIndex}`]: draggedMeaning })}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if ((event.key === 'Enter' || event.key === ' ') && draggedMeaning) {
                          setAnswers({ ...answers, [`match-${index}-${pairIndex}`]: draggedMeaning });
                        }
                      }}
                    >
                      {selected || 'Suelta aquí la respuesta'}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          );
        }

        const chosen = orderAnswers[index] || [];
        const complete = chosen.length === activity.steps.length;
        const correct = complete && chosen.every((step, stepIndex) => step === activity.steps[stepIndex]);
        const available = [...activity.steps].reverse().filter((step) => !chosen.includes(step));
        return (
          <div className="mini-activity" key={`${card.title}-${index}`}>
            <div className="mini-heading"><ArrowRight size={20} /> <strong>Actividad {index + 1}: ordena</strong></div>
            <p>{activity.prompt}</p>
            <div className="chosen-row compact">
              {activity.steps.map((_, stepIndex) => <span className="slot" key={stepIndex}>{chosen[stepIndex] || stepIndex + 1}</span>)}
            </div>
            <div className="answer-grid">
              {available.map((step) => <button className="answer" key={step} onClick={() => chooseStep(index, step)}>{step}</button>)}
            </div>
            {complete && <div className={`result ${correct ? 'success' : 'try-again'}`}>{correct ? 'Correcto.' : 'Reinicia e inténtalo otra vez.'}</div>}
            <button className="reset-button" type="button" onClick={() => resetOrder(index)}><RotateCcw size={16} /> Reiniciar</button>
          </div>
        );
      })}
    </div>
  );
}

function AnnotatedImage({ src, alt, labels }) {
  return (
    <div className="annotated-image-wrap">
      <img src={src} alt={alt} className="lesson-image annotated-base" />
      <svg className="image-callout-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {labels.map((label) => (
          <g key={`${label.text}-line`}>
            <line x1={label.x} y1={label.y} x2={label.targetX} y2={label.targetY} />
            <circle cx={label.targetX} cy={label.targetY} r="1.2" />
          </g>
        ))}
      </svg>
      {labels.map((label) => (
        <div className="image-label" key={label.text} style={{ left: `${label.x}%`, top: `${label.y}%` }}>
          <span>{label.text}</span>
        </div>
      ))}
    </div>
  );
}

function InfoBubbles({ items }) {
  const [activeBubble, setActiveBubble] = useState('');

  return (
    <div className="info-bubbles">
      <div className="bubble-buttons">
        {items.map((item) => (
          <button className={activeBubble === item.title ? 'bubble-button active' : 'bubble-button'} key={item.title} type="button" onClick={() => setActiveBubble(activeBubble === item.title ? '' : item.title)}>
            {item.title}
          </button>
        ))}
      </div>
      {items.map((item, index) => activeBubble === item.title && (
        <div className="bubble-content" key={`${item.title}-content`} style={{ '--bubble-arrow-left': index === 0 ? '2rem' : '9.5rem' }}>
          <FormattedText text={item.text} />
        </div>
      ))}
    </div>
  );
}

function ObjectGallery({ items }) {
  const [activeItem, setActiveItem] = useState(0);
  const item = items[activeItem];

  return (
    <div className="object-gallery">
      <div className="object-gallery-title">Objetos litúrgicos</div>
      <div className="object-gallery-view">
        <button className="gallery-arrow" type="button" onClick={() => setActiveItem((activeItem - 1 + items.length) % items.length)}><ChevronLeft size={22} /></button>
        <figure>
          <img src={item.image} alt={item.name} />
          <figcaption><strong>{item.name}</strong><span>{item.function}</span></figcaption>
        </figure>
        <button className="gallery-arrow" type="button" onClick={() => setActiveItem((activeItem + 1) % items.length)}><ChevronRight size={22} /></button>
      </div>
      <div className="viewer-dots object-dots">
        {items.map((galleryItem, index) => (
          <button className={index === activeItem ? 'dot active' : 'dot'} key={galleryItem.name} onClick={() => setActiveItem(index)} />
        ))}
      </div>
    </div>
  );
}

function LessonCard({ card, current, total, onOpenPrayer }) {
  const Icon = card.icon;

  return (
    <article className="lesson-card">
      <div className="card-counter">{current} de {total}</div>
      {card.image && (card.imageLabels ? <AnnotatedImage src={card.image} alt={card.title} labels={card.imageLabels} /> : <img src={card.image} alt={card.title} className="lesson-image" />)}
      <div className="lesson-copy">
        <div className="lesson-title"><span className="timeline-icon"><Icon size={18} /></span><h3>{card.title}</h3></div>
        <FormattedText text={card.text} />
        {card.prayer && (
          <button className="prayer-button" onClick={() => onOpenPrayer(card.prayer)}><ScrollText size={18} /> Ver oración</button>
        )}
        {card.infoBubbles && <InfoBubbles items={card.infoBubbles} />}
      </div>
      <div className="lesson-media-column">
        {card.video && (
          <div className="video-card lesson-video">
            <div className="video-title"><PlayCircle size={20} /> Vídeo</div>
            <video src={card.video} controls preload="metadata" />
          </div>
        )}
        {card.objectGallery && <ObjectGallery items={card.objectGallery} />}
        <div className="remember-box">
          <CheckCircle2 size={18} /> <strong>Recuerda:</strong> <FormattedText text={card.remember} />
        </div>
      </div>
    </article>
  );
}

function SectionCard({ section, isOpen, isLocked, onToggle, onOpenPrayer }) {
  const [activeCard, setActiveCard] = useState(0);
  const handleToggle = () => { if (isLocked) return; if (!isOpen) setActiveCard(0); onToggle(); };
  const Icon = section.icon;
  const card = section.cards[activeCard];

  return (
    <article className={`section-card ${isOpen && !isLocked ? 'is-open' : ''} ${isLocked ? 'is-locked' : ''}`}>
      <button className="section-head" onClick={handleToggle} aria-expanded={isOpen && !isLocked} aria-disabled={isLocked}>
        <span className="icon-bubble"><Icon size={30} /></span>
        <span className="section-title-wrap">
          <span className="eyebrow">Parte {section.id === -1 ? 0 : section.id + 1}</span>
          <span className="section-title">{section.title}</span>
          {isLocked && <span className="locked-label">Bloqueada por el profesor</span>}
        </span>
        {isLocked ? <span className="lock-badge">Cerrada</span> : isOpen ? <ChevronUp className="chevron" /> : <ChevronDown className="chevron" />}
      </button>

      <div className="section-body" hidden={!isOpen || isLocked}>
        <div className="card-viewer">
          <button className="viewer-arrow" onClick={() => setActiveCard((activeCard - 1 + section.cards.length) % section.cards.length)}><ChevronLeft size={28} /></button>
          <LessonCard card={card} current={activeCard + 1} total={section.cards.length} onOpenPrayer={onOpenPrayer} />
          <button className="viewer-arrow" onClick={() => setActiveCard((activeCard + 1) % section.cards.length)}><ChevronRight size={28} /></button>
        </div>
        <div className="viewer-dots">
          {section.cards.map((_, index) => (
            <button className={index === activeCard ? 'dot active' : 'dot'} key={index} onClick={() => setActiveCard(index)} />
          ))}
        </div>
        <CardActivities key={card.title} card={card} />
      </div>
    </article>
  );
}

const misaData = [
  {
    id: -1,
    title: 'Lugar de la celebración y ornamentos',
    icon: Sparkles,
    description: 'Conocemos el templo, las posturas, los ornamentos y los objetos litúrgicos.',
    cards: [
      { title: 'Lugar de la celebración', icon: Sparkles, image: asset('/fotos/interior iglesia.jpg'), text: 'La iglesia es un lugar sagrado donde nos reunimos los cristianos para celebrar los sacramentos, especialmente la Eucaristía. Dios está presente en cada iglesia; por eso estamos en silencio, con respeto y veneración. La iglesia es la casa de Dios.', remember: 'La iglesia es la casa de Dios y un lugar sagrado para celebrar la Eucaristía.' },
      { title: 'Elementos de la iglesia', icon: BookOpen, image: asset('/fotos/iglesia.jpg'), imageLabels: [
        { text: 'Ambón', x: 17, y: 34, targetX: 28, targetY: 52 },
        { text: 'Altar', x: 45, y: 39, targetX: 50, targetY: 52 },
        { text: 'Presbiterio', x: 65, y: 58, targetX: 50, targetY: 58 },
        { text: 'Nave', x: 35, y: 76, targetX: 47, targetY: 68 },
      ], text: `En la iglesia encontramos varios elementos importantes:
- **Altar**: mesa donde se realiza el sacrificio de Jesús.
- **Ambón**: lugar desde donde se proclama la Palabra de Dios.
- **Presbiterio**: espacio principal donde están el altar y la sede.
- **Nave**: lugar donde se sitúan los fieles.`, remember: 'El altar, el ambón, la nave y el presbiterio nos ayudan a vivir mejor la celebración.' },
      { title: 'Ornamentos y posturas', icon: Users, image: asset('/fotos/casullas.jpg'), text: 'El sacerdote se reviste con ornamentos litúrgicos para celebrar los sacramentos. Cuando vemos al sacerdote revestido, recordamos que actúa en nombre de Jesús.', infoBubbles: [
        { title: 'Ornamentos', text: `**Colores litúrgicos**
- **Blanco**: fiesta; se usa en Navidad y Pascua.
- **Verde**: esperanza; se usa durante el tiempo ordinario.
- **Rojo**: sangre y fuego; se usa en la Pasión y fiestas de mártires.
- **Morado**: penitencia; se usa en Adviento, Cuaresma y Misas de difuntos.` },
        { title: 'Posturas', text: `**Posturas y significado**
- **De pie**: respeto y veneración.
- **Sentados**: escucha y reflexión.
- **Arrodillarse**: adoración al Señor en la Eucaristía.
- **Beso o dar la mano**: cariño y fraternidad.
- **Responder a las oraciones**: unión con la oración del sacerdote.` },
      ], remember: 'Los ornamentos, los colores y las posturas nos ayudan a rezar con el cuerpo y el corazón.' },
      { title: 'Objetos litúrgicos', icon: Wine, image: asset('/fotos/elementos.jpg'), objectGallery: [
        { name: 'Cáliz', image: asset('/fotos/cáliz.jpg'), function: 'Copa para la Sangre de Cristo.' },
        { name: 'Patena', image: asset('/fotos/patena.jpg'), function: 'Platillo para el pan que será consagrado.' },
        { name: 'Palia', image: asset('/fotos/Corporal.jpg'), function: 'Pieza rígida que cubre el cáliz.' },
        { name: 'Corporal', image: asset('/fotos/Corporal.jpg'), function: 'Lienzo que se coloca sobre el altar.' },
        { name: 'Copón', image: asset('/fotos/copon.jpg'), function: 'Recipiente para guardar formas consagradas.' },
        { name: 'Vinajeras', image: asset('/fotos/vinajeras.jpg'), function: 'Contienen el agua y el vino.' },
      ], text: 'En la Misa se utilizan libros y objetos litúrgicos. Son objetos cuidados porque estarán en contacto con el Cuerpo y la Sangre de Jesús. Puedes verlos en el carrusel.', remember: 'Los objetos litúrgicos se usan con respeto porque sirven para celebrar la Eucaristía.' },
    ]
  },
  {
    id: 0,
    title: 'Ritos iniciales',
    icon: Users,
    description: 'Jesús nos convoca como Pueblo de Dios.',
    cards: [
      { title: 'Introito y acto penitencial', icon: Heart, image: asset('/fotos/entrada.jpg'), video: asset('/videos/1. Introito y acto penitencial.mp4'), text: 'Jesús sale a nuestro encuentro y nos reúne para celebrar su Pasión, Muerte y Resurrección. Nos preparamos para nuestro encuentro con Jesús con el acto penitencial.', remember: 'Jesús nos convoca como Pueblo de Dios.', prayer: 'Yo confieso' },
      { title: 'Gloria', icon: Music, image: asset('/fotos/iglesia-llena.jpg'), video: asset('/videos/2. Gloria.mp4'), text: 'En los ritos iniciales alabamos a Dios con el canto del Gloria. Es una oración de alegría porque celebramos la gran fiesta de Jesús.', remember: 'Alabamos a Dios con alegría.', prayer: 'Gloria' },
      { title: 'Oración colecta', icon: MessageCircle, image: asset('/fotos/misal.jpg'), text: 'La oración colecta recoge la oración de toda la Iglesia al comenzar la celebración. Nos unimos para presentar a Dios nuestra oración.', remember: 'Rezamos unidos como Iglesia.' }
    ]
  },
  {
    id: 1,
    title: 'Liturgia de la Palabra',
    icon: BookOpen,
    description: 'Jesús nos habla en su Palabra.',
    cards: [
      { title: 'Lecturas', icon: BookOpen, image: asset('/fotos/liturgia palabra.jpg'), video: asset('/videos/4. Lecturas.mp4'), text: 'Es Jesús mismo quien nos habla y nos cuenta lo que Dios hace por nosotros. En las lecturas se leen uno o dos pasajes del Antiguo o del Nuevo Testamento.', remember: 'En la Liturgia de la Palabra es Jesús mismo quien nos habla.' },
      { title: 'Evangelio y homilía', icon: Sun, image: asset('/fotos/Evangelio.jpg'), video: asset('/videos/5. Homilía.mp4'), text: 'En el Evangelio, el sacerdote proclama un pasaje. Jesús nos explica las Escrituras como a los discípulos de Emaús. En la homilía, el sacerdote nos ayuda a comprender la Palabra de Dios y aplicarla a nuestra vida.', remember: 'Jesús nos explica las Escrituras.' },
      { title: 'Credo y Oración universal', icon: Heart, image: asset('/fotos/niño_de_rodillas.jpg'), video: asset('/videos/9. Petición.mp4'), text: 'En el Credo respondemos a lo que Jesús nos acaba de decir en su Palabra proclamando nuestra fe. En la oración universal rezamos por las necesidades de la Iglesia y del mundo entero.', remember: 'Respondemos con fe y rezamos por todos.', prayer: 'Credo' }
    ]
  },
  {
    id: 2,
    title: 'Liturgia Eucarística',
    icon: Wine,
    description: 'El sacerdote repite los gestos y palabras de Jesús en la Última Cena.',
    cards: [
      { title: 'Presentación de las ofrendas', icon: ArrowRight, image: asset('/fotos/Ofrendas.jpg'), video: asset('/videos/6. Ofertorio.mp4'), text: 'Jesús toma el pan y el vino. Se presentan el pan y el vino y se bendice a Dios por esos dones.', remember: 'Jesús toma el pan y el vino.', prayer: 'Bendito seas' },
      { title: 'Plegaria Eucarística', icon: Sparkles, image: asset('/fotos/Jesus-en-la-cruz.jpg'), video: asset('/videos/7. Santo.mp4'), text: 'La Plegaria Eucarística es la gran oración de adoración, alabanza y acción de gracias a Dios Padre que Jesús hace por medio del Espíritu Santo, unido a nosotros, que somos su Cuerpo.', remember: 'Jesús bendice a Dios Padre y le da gracias.', prayer: 'Santo' },
      { title: 'Consagración', icon: Wine, image: asset('/fotos/papa_caliz.jpg'), video: asset('/videos/10. Plegaria eucarística.mp4'), text: 'En la Consagración, el sacerdote dice las palabras de Jesús en su nombre, y el pan y el vino se transforman en el Cuerpo y la Sangre de Cristo. Este misterio se llama transustanciación.', remember: 'Jesús se hace realmente presente.', prayer: 'Palabras de la consagración' },
      { title: 'Santos y almas del purgatorio', icon: Users, image: asset('/fotos/interior iglesia.jpg'), video: asset('/videos/8. Santos y almas del purgatorio.mp4'), text: 'En la Misa estamos unidos a toda la Iglesia: los santos del cielo, las almas del purgatorio y todos los fieles que peregrinan en la tierra.', remember: 'La Iglesia es una gran familia.' },
      { title: 'Padre nuestro', icon: MessageCircle, image: asset('/fotos/dando la mano.jpg'), video: asset('/videos/11. Padrenuestro y rito comunión.mp4'), text: 'Rezamos la oración que Jesús nos enseñó y nos preparamos para recibir el Pan de Vida, unidos como hermanos.', remember: 'Dios es Padre y nos une.', prayer: 'Padrenuestro' },
      { title: 'Comunión', icon: Wine, image: asset('/fotos/comunión.jpg'), video: asset('/videos/12. Comunión.mp4'), text: 'Jesús parte para nosotros el Pan de Vida. Jesús en la Eucaristía es el alimento que nos da la Vida eterna y hace que formemos un solo Cuerpo con nuestros hermanos en la fe.', remember: 'Jesús parte para nosotros el Pan de Vida.' },
      { title: 'Acción de gracias', icon: Trophy, image: asset('/fotos/niño_de_rodillas.jpg'), video: asset('/videos/14. Acción de gracias.mp4'), text: 'Después de recibir a Jesús, damos gracias por su presencia y por el regalo de la Eucaristía, que nos da la gracia que necesitamos para nuestra vida.', remember: 'Damos gracias a Jesús por quedarse con nosotros.' }
    ]
  },
  {
    id: 3,
    title: 'Rito de despedida',
    icon: Send,
    description: 'Jesús nos envía a anunciar el Evangelio.',
    cards: [
      { title: 'Oración y bendición final', icon: Send, image: asset('/fotos/bendición.jpg'), video: asset('/videos/13. Oración y bendición final.mp4'), text: 'Al terminar la Misa, recibimos el encargo de llevar la Buena Noticia a todas las personas.', remember: 'Jesús nos envía a anunciar el Evangelio.' }
    ]
  }
];

export default function App() {
  const [openSection, setOpenSection] = useState(-1);
  const [prayerModal, setPrayerModal] = useState(null);
  const [showCover, setShowCover] = useState(true);
  const [showPrologue, setShowPrologue] = useState(false);
  const [showAppInfo, setShowAppInfo] = useState(false);
  const [showTeacherPage, setShowTeacherPage] = useState(() => isTeacherRoute());
  const [showTeacherLogin, setShowTeacherLogin] = useState(false);
  const [showStudentGame, setShowStudentGame] = useState(false);
  const [isLocalTeacher, setIsLocalTeacher] = useState(false);
  const [pendingTeacherNavigation, setPendingTeacherNavigation] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const [teacherAllowed, setTeacherAllowed] = useState(false);
  const [teacherAccessChecked, setTeacherAccessChecked] = useState(false);
  const [classes, setClasses] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [textOverrides, setTextOverrides] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(TEXT_OVERRIDES_KEY)) || {};
    } catch {
      return {};
    }
  });
  const [introOverrides, setIntroOverrides] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(INTRO_OVERRIDES_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [activityOverrides, setActivityOverrides] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(ACTIVITY_OVERRIDES_KEY)) || {};
    } catch {
      return {};
    }
  });
  const [imageOverrides, setImageOverrides] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(IMAGE_OVERRIDES_KEY)) || {};
    } catch {
      return {};
    }
  });
  const [gameQuestions, setGameQuestions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(GAME_QUESTIONS_KEY)) || teacherGameQuestions;
    } catch {
      return teacherGameQuestions;
    }
  });
  const [lockedSections, setLockedSections] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LOCKED_SECTIONS_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [gameVisible, setGameVisible] = useState(() => localStorage.getItem(GAME_VISIBLE_KEY) === 'true');
  const [studentList, setStudentList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STUDENT_LIST_KEY)) || [];
    } catch {
      return [];
    }
  });
  const editableSections = applyImageOverrides(applyActivityOverrides(applyTextOverrides(cloneMisaData(), textOverrides), activityOverrides), imageOverrides);
  const introText = getIntroText(introOverrides);
  const canOpenTeacherPage = isFirebaseConfigured ? Boolean(teacher && teacherAllowed) : isLocalTeacher;

  const goToTeacherPage = () => {
    window.history.pushState(null, '', getTeacherPath());
    setShowTeacherPage(true);
    setShowTeacherLogin(false);
  };

  useEffect(() => {
    const syncTeacherRoute = () => setShowTeacherPage(isTeacherRoute());
    window.addEventListener('popstate', syncTeacherRoute);
    return () => window.removeEventListener('popstate', syncTeacherRoute);
  }, []);

  const openTeacherAccess = () => {
    if (canOpenTeacherPage) {
      goToTeacherPage();
      return;
    }
    setShowTeacherLogin(true);
  };

  const closeTeacherPage = () => {
    window.history.pushState(null, '', BASE_URL);
    setShowTeacherPage(false);
  };

  const closeTeacherLogin = () => {
    setShowTeacherLogin(false);
    setPendingTeacherNavigation(false);
    if (isTeacherRoute() && !canOpenTeacherPage) closeTeacherPage();
  };

  const loginLocalTeacher = () => {
    setIsLocalTeacher(true);
    goToTeacherPage();
  };

  useEffect(() => {
    if (showTeacherPage && !canOpenTeacherPage) setShowTeacherLogin(true);
  }, [showTeacherPage, canOpenTeacherPage]);

  useEffect(() => {
    if (showTeacherLogin && canOpenTeacherPage) goToTeacherPage();
  }, [showTeacherLogin, canOpenTeacherPage]);

  useEffect(() => {
    if (!pendingTeacherNavigation || !canOpenTeacherPage) return;
    setPendingTeacherNavigation(false);
    goToTeacherPage();
  }, [pendingTeacherNavigation, canOpenTeacherPage]);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return undefined;
    return onAuthStateChanged(auth, (currentUser) => {
      setTeacher(currentUser);
      if (!currentUser) {
        setClasses([]);
        setActiveClass(null);
        setTeacherAllowed(false);
        setTeacherAccessChecked(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !teacher) return;

    const checkTeacherAccess = async () => {
      setTeacherAccessChecked(false);
      if (isBootstrapTeacher(teacher)) {
        setTeacherAllowed(true);
        setTeacherAccessChecked(true);
        return;
      }
      const email = normalizeEmail(teacher.email || '');
      if (!email) {
        setTeacherAllowed(false);
        setTeacherAccessChecked(true);
        return;
      }
      const teacherDoc = await getDoc(doc(db, 'teachers', email));
      setTeacherAllowed(teacherDoc.exists());
      setTeacherAccessChecked(true);
    };

    checkTeacherAccess();
  }, [teacher]);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    const classId = new URLSearchParams(window.location.search).get('class');
    if (classId) selectClass(classId, [{ id: classId }]);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !teacher || !teacherAllowed) return;

    const loadClasses = async () => {
      const classesQuery = query(collection(db, 'classes'), where('ownerUid', '==', teacher.uid));
      const snapshot = await getDocs(classesQuery);
      const nextClasses = snapshot.docs.map((classDoc) => ({ id: classDoc.id, ...classDoc.data() }));
      setClasses(nextClasses);

      const storedClassId = localStorage.getItem(ACTIVE_CLASS_KEY);
      const nextActiveClass = nextClasses.find((classItem) => classItem.id === storedClassId) || nextClasses[0] || null;
      if (nextActiveClass) selectClass(nextActiveClass.id, nextClasses);
    };

    loadClasses();
  }, [teacher, teacherAllowed]);

  const selectClass = async (classId, availableClasses = classes) => {
    const classDoc = availableClasses.find((classItem) => classItem.id === classId);
    if (!classDoc) return;
    const freshDoc = db ? await getDoc(doc(db, 'classes', classId)) : null;
    const nextClass = freshDoc?.exists() ? { id: freshDoc.id, ...freshDoc.data() } : classDoc;
    let nextGameQuestions = nextClass.gameQuestions;
    if (!nextGameQuestions?.length) {
      const classWithQuestions = availableClasses.find((classItem) => classItem.id !== nextClass.id && classItem.gameQuestions?.length);
      nextGameQuestions = classWithQuestions?.gameQuestions;
    }
    if (!nextGameQuestions?.length && db && nextClass.ownerUid) {
      const classesQuery = query(collection(db, 'classes'), where('ownerUid', '==', nextClass.ownerUid));
      const snapshot = await getDocs(classesQuery);
      const classWithQuestions = snapshot.docs
        .map((classSnapshot) => ({ id: classSnapshot.id, ...classSnapshot.data() }))
        .find((classItem) => classItem.id !== nextClass.id && classItem.gameQuestions?.length);
      nextGameQuestions = classWithQuestions?.gameQuestions;
    }
    setActiveClass(nextClass);
    setLockedSections(nextClass.lockedSections || []);
    setTextOverrides(nextClass.textOverrides || {});
    setIntroOverrides(nextClass.introOverrides || []);
    setActivityOverrides(nextClass.activityOverrides || {});
    setImageOverrides(nextClass.imageOverrides || {});
    setGameQuestions(nextGameQuestions || teacherGameQuestions);
    setGameVisible(Boolean(nextClass.gameVisible));
    setStudentList(nextClass.studentNames || []);
    localStorage.setItem(ACTIVE_CLASS_KEY, nextClass.id);
  };

  const loginTeacher = async () => {
    if (!auth || !googleProvider) return;
    await signInWithPopup(auth, googleProvider);
    setPendingTeacherNavigation(true);
  };

  const logoutTeacher = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const createClass = async (name) => {
    if (!db) throw new Error('Firebase no está conectado.');
    if (!teacher) throw new Error('Tienes que entrar con Google para crear una clase.');
    if (!teacherAllowed) throw new Error('Esta cuenta no tiene permiso para crear clases.');
    const newClass = {
      name,
      ownerUid: teacher.uid,
      ownerEmail: teacher.email,
      lockedSections: [],
      textOverrides: getTextOverrides(cloneMisaData()),
      introOverrides: celebrationIntro,
      activityOverrides: cardActivities,
      imageOverrides: {},
      gameQuestions: teacherGameQuestions,
      gameVisible: false,
      studentNames: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const created = await addDoc(collection(db, 'classes'), newClass);
    const nextClass = { id: created.id, ...newClass, createdAt: null, updatedAt: null };
    const nextClasses = [nextClass, ...classes];
    setClasses(nextClasses);
    await selectClass(created.id, nextClasses);
  };

  const addTeacherEmail = async (email) => {
    if (!db) throw new Error('Firebase no está conectado.');
    if (!teacher) throw new Error('Tienes que entrar con Google para añadir profesores.');
    if (!teacherAllowed) throw new Error('Esta cuenta no tiene permiso para añadir profesores.');
    const normalizedEmail = normalizeEmail(email);
    await setDoc(doc(db, 'teachers', normalizedEmail), {
      email: normalizedEmail,
      createdBy: teacher.email,
      createdAt: serverTimestamp(),
    }, { merge: true });
  };

  const saveClassState = async (
    nextLockedSections,
    nextTextOverrides = textOverrides,
    nextIntroOverrides = introOverrides,
    nextActivityOverrides = activityOverrides,
    nextImageOverrides = imageOverrides,
    nextGameVisible = gameVisible,
    nextGameQuestions = gameQuestions,
    nextStudentList = studentList
  ) => {
    if (!isFirebaseConfigured || !db || !activeClass) {
      if (isFirebaseConfigured) return;
      localStorage.setItem(LOCKED_SECTIONS_KEY, JSON.stringify(nextLockedSections));
      localStorage.setItem(TEXT_OVERRIDES_KEY, JSON.stringify(nextTextOverrides));
      localStorage.setItem(INTRO_OVERRIDES_KEY, JSON.stringify(nextIntroOverrides));
      localStorage.setItem(ACTIVITY_OVERRIDES_KEY, JSON.stringify(nextActivityOverrides));
      localStorage.setItem(IMAGE_OVERRIDES_KEY, JSON.stringify(nextImageOverrides));
      localStorage.setItem(GAME_VISIBLE_KEY, JSON.stringify(nextGameVisible));
      localStorage.setItem(GAME_QUESTIONS_KEY, JSON.stringify(nextGameQuestions));
      localStorage.setItem(STUDENT_LIST_KEY, JSON.stringify(nextStudentList));
      return;
    }
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'classes', activeClass.id), {
        lockedSections: nextLockedSections,
        textOverrides: nextTextOverrides,
        introOverrides: nextIntroOverrides,
        activityOverrides: nextActivityOverrides,
        imageOverrides: nextImageOverrides,
        gameVisible: nextGameVisible,
        gameQuestions: nextGameQuestions,
        studentNames: nextStudentList,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } finally {
      setIsSaving(false);
    }
  };

  const saveLockedSections = (nextLockedSections) => {
    setLockedSections(nextLockedSections);
    saveClassState(nextLockedSections);
    if (nextLockedSections.includes(openSection)) setOpenSection(null);
  };

  const toggleLockedSection = (sectionId) => {
    const nextLockedSections = lockedSections.includes(sectionId)
      ? lockedSections.filter((id) => id !== sectionId)
      : [...lockedSections, sectionId];
    saveLockedSections(nextLockedSections);
  };

  const saveText = async (cardTitle, text, remember) => {
    const nextTextOverrides = {
      ...textOverrides,
      [cardTitle]: { text, remember },
    };
    setTextOverrides(nextTextOverrides);
    await saveClassState(lockedSections, nextTextOverrides);
  };

  const saveIntro = async (nextIntroOverrides) => {
    setIntroOverrides(nextIntroOverrides);
    await saveClassState(lockedSections, textOverrides, nextIntroOverrides);
  };

  const saveActivities = async (cardTitle, nextActivities) => {
    const nextActivityOverrides = {
      ...activityOverrides,
      [cardTitle]: nextActivities,
    };
    setActivityOverrides(nextActivityOverrides);
    await saveClassState(lockedSections, textOverrides, introOverrides, nextActivityOverrides);
  };

  const saveImage = async (cardTitle, nextImage) => {
    const nextImageOverrides = nextImage
      ? { ...imageOverrides, [cardTitle]: nextImage }
      : Object.fromEntries(Object.entries(imageOverrides).filter(([title]) => title !== cardTitle));
    setImageOverrides(nextImageOverrides);
    await saveClassState(lockedSections, textOverrides, introOverrides, activityOverrides, nextImageOverrides);
  };

  const toggleGameVisible = async () => {
    const nextGameVisible = !gameVisible;
    setGameVisible(nextGameVisible);
    await saveClassState(lockedSections, textOverrides, introOverrides, activityOverrides, imageOverrides, nextGameVisible, gameQuestions);
  };

  const saveGameQuestions = async (nextGameQuestions) => {
    setGameQuestions(nextGameQuestions);
    await saveClassState(lockedSections, textOverrides, introOverrides, activityOverrides, imageOverrides, gameVisible, nextGameQuestions);
  };

  const saveStudentList = async (nextStudentList) => {
    setStudentList(nextStudentList);
    await saveClassState(lockedSections, textOverrides, introOverrides, activityOverrides, imageOverrides, gameVisible, gameQuestions, nextStudentList);
  };

  return (
    <div className="page-shell">
      {prayerModal && (
        <PrayerModal prayerTitle={prayerModal} prayerLines={prayers[prayerModal]} onClose={() => setPrayerModal(null)} />
      )}
      {showPrologue && <PrologueModal onClose={() => setShowPrologue(false)} />}
      {showAppInfo && <AppInfoModal onClose={() => setShowAppInfo(false)} />}
      {showTeacherLogin && (
        <TeacherLoginModal
          firebaseEnabled={isFirebaseConfigured}
          onClose={closeTeacherLogin}
          onGoogleLogin={loginTeacher}
          onLocalLogin={loginLocalTeacher}
          onLogout={logoutTeacher}
          teacher={teacher}
          teacherAccessChecked={teacherAccessChecked}
          teacherAllowed={teacherAllowed}
        />
      )}
      {showTeacherPage && canOpenTeacherPage ? (
        <TeacherPage
          activeClass={activeClass}
          classes={classes}
          editableSections={editableSections}
          firebaseEnabled={isFirebaseConfigured}
          gameQuestions={gameQuestions}
           gameVisible={gameVisible}
           imageOverrides={imageOverrides}
           introText={introText}
           isSaving={isSaving}
           lockedSections={lockedSections}
           onClose={closeTeacherPage}
           onCreateClass={createClass}
           onLogout={logoutTeacher}
           onAddTeacherEmail={addTeacherEmail}
           onSaveActivities={saveActivities}
           onSaveGameQuestions={saveGameQuestions}
           onSaveImage={saveImage}
           onSaveIntro={saveIntro}
           onSaveStudentList={saveStudentList}
           onSaveText={saveText}
           onSelectClass={selectClass}
           onToggleGameVisible={toggleGameVisible}
           studentList={studentList}
          onUnlockAll={() => saveLockedSections([])}
          onToggleSection={toggleLockedSection}
          teacher={teacher}
          teacherAllowed={teacherAllowed}
        />
      ) : showStudentGame ? (
        <main className="teacher-page">
          <div className="teacher-page-shell">
            <TeacherGame closeLabel="Volver" onClose={() => setShowStudentGame(false)} questions={gameQuestions} isStudent />
          </div>
        </main>
      ) : showCover ? (
        <header className="hero cover-hero">
          <nav className="cover-topbar">
            <img src={asset('/logo colegio.png')} alt="Logo" className="school-logo cover-logo" />
          </nav>
          <div className="cover-content">
            <img src={asset('/fotos/El_cristo_de_san_juan_de_la_cruz.jpg')} alt="Cristo" className="cover-image" />
            <h1>Tanto amó Dios al mundo</h1>
            <p className="cover-citation">(Jn 3, 16)</p>
            <p className="hero-copy cover-copy">Descubre lo que sucede en la Misa.</p>
            <button className="primary-button cover-start" onClick={() => setShowCover(false)}>Empezar</button>
            <div className="cover-links">
              <button className="cover-info" type="button" onClick={() => setShowPrologue(true)}>Prólogo</button>
              <button className="cover-info" type="button" onClick={() => setShowAppInfo(true)}>Más información</button>
            </div>
          </div>
        </header>
      ) : (
      <main className="app-main">
        <section className="content-section" id="partes">
          <div className="content-actions">
            <button className="back-home-button primary-button" type="button" onClick={() => setShowCover(true)}>Volver al inicio</button>
            {gameVisible && <button className="teacher-access-button primary-button" type="button" onClick={() => setShowStudentGame(true)}>Juego</button>}
            <button className="teacher-access-button primary-button" type="button" onClick={openTeacherAccess}>Profesor</button>
          </div>
          <h2 className="eucaristia-heading">La celebración de la Eucaristía</h2>
          <div className="celebration-intro">
            <img className="celebration-intro-image" src={asset('/fotos/jesus-crucificado.jpg')} alt="Jesús crucificado" />
            <FormattedText text={introText.join('\n')} />
          </div>
          <div className="sections-list">
            {editableSections.map((section) => (
              <SectionCard key={section.id} section={section} isOpen={openSection === section.id} isLocked={lockedSections.includes(section.id)} onToggle={() => setOpenSection(openSection === section.id ? null : section.id)} onOpenPrayer={setPrayerModal} />
            ))}
          </div>
        </section>
      </main>
      )}
    </div>
  );
}
