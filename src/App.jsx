import { useState } from 'react';
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
  Trophy,
  Users,
  Wine,
  X,
  ScrollText
} from 'lucide-react';

const asset = (path) => encodeURI(path);

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

const introInfo = [
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

const cardActivities = {
  'Introito y acto penitencial': {
    question: '¿Qué pido a Dios al comenzar la Misa?',
    options: ['Perdón', 'Un regalo', 'Salir pronto'],
    answer: 'Perdón',
  },
  'Gloria': {
    question: '¿Qué actitud vivimos en el Gloria?',
    options: ['Alabanza', 'Enfado', 'Silencio'],
    answer: 'Alabanza',
  },
  'Lecturas': {
    question: 'Cuando escucho las lecturas, Dios me habla...',
    options: ['hoy', 'nunca', 'sólo los domingos'],
    answer: 'hoy',
  },
  'Evangelio y homilía': {
    question: '¿Por qué nos ponemos de pie en el Evangelio?',
    options: ['Porque escuchamos a Jesús', 'Por cansancio', 'Por juego'],
    answer: 'Porque escuchamos a Jesús',
  },
  'Credo y Oración universal': {
    question: '¿Por quién rezamos en las peticiones?',
    options: ['Por todos', 'Por nadie', 'Sólo por mí'],
    answer: 'Por todos',
  },
  'Presentación de las ofrendas': {
    question: '¿Qué presento a Dios?',
    options: ['Mi vida', 'Nada', 'Un juguete'],
    answer: 'Mi vida',
  },
  'Santo': {
    question: 'En el Santo alabamos a Dios con...',
    options: ['toda la Iglesia', 'gritos', 'prisa'],
    answer: 'toda la Iglesia',
  },
  'Santos y almas del purgatorio': {
    question: '¿Con quién estamos unidos en la Misa?',
    options: ['Con los santos', 'Con nadie', 'Con los vecinos'],
    answer: 'Con los santos',
  },
  'Plegaria Eucarística': {
    question: 'La Plegaria es una gran...',
    options: ['Acción de gracias', 'Charla', 'Petición'],
    answer: 'Acción de gracias',
  },
  'Consagración': {
    question: 'En la consagración, Jesús está...',
    options: ['realmente presente', 'lejos', 'ausente'],
    answer: 'realmente presente',
  },
  'Padre nuestro': {
    question: 'El Padrenuestro nos recuerda que Dios es...',
    options: ['Padre', 'un amigo', 'un jefe'],
    answer: 'Padre',
  },
  'Comunión': {
    question: 'En la Comunión recibimos a...',
    options: ['Jesús', 'pan normal', 'nada'],
    answer: 'Jesús',
  },
  'Acción de gracias': {
    question: 'Después de comulgar conviene...',
    options: ['dar gracias', 'irse pronto', 'hablar'],
    answer: 'dar gracias',
  },
  'Oración y bendición final': {
    question: 'Al final de la Misa somos enviados a...',
    options: ['amar mejor', 'dormir', 'olvidar'],
    answer: 'amar mejor',
  },
};

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

function InfoModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content info-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X /></button>
        <h2 className="modal-title">Tanto amó Dios al mundo</h2>
        <div className="intro-info-text">
          {introInfo.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardActivities({ card }) {
  const [answer, setAnswer] = useState('');
  const [summary, setSummary] = useState('');
  const activity = cardActivities[card.title];

  if (!activity) return null;

  return (
    <div className="section-activities card-specific-activities">
      <div className="mini-activity">
        <div className="mini-heading"><HelpCircle size={20} /> <strong>Actividad 1</strong></div>
        <p>{activity.question}</p>
        <div className="answer-grid">
          {activity.options.map((option) => (
            <button className={'answer ' + (answer === option && option === activity.answer ? 'correct' : answer === option ? 'wrong' : '')} key={option} onClick={() => setAnswer(option)}>{option}</button>
          ))}
        </div>
      </div>
      <div className="mini-activity">
        <div className="mini-heading"><CheckCircle2 size={20} /> <strong>Actividad 2</strong></div>
        <p>¿Qué frase resume mejor este momento?</p>
        <div className="answer-grid">
          {[card.remember, 'Tener prisa', 'No prestar atención'].map((option) => (
            <button className={'answer ' + (summary === option && option === card.remember ? 'correct' : summary === option ? 'wrong' : '')} key={option} onClick={() => setSummary(option)}>{option}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LessonCard({ card, current, total, onOpenPrayer }) {
  const Icon = card.icon;

  return (
    <article className="lesson-card">
      <div className="card-counter">{current} de {total}</div>
      <img src={card.image} alt={card.title} className="lesson-image" />
      <div className="lesson-copy">
        <div className="lesson-title"><span className="timeline-icon"><Icon size={18} /></span><h3>{card.title}</h3></div>
        <p>{card.text}</p>
        {card.prayer && (
          <button className="prayer-button" onClick={() => onOpenPrayer(card.prayer)}><ScrollText size={18} /> Ver oración</button>
        )}
      </div>
      <div className="lesson-media-column">
        {card.video && (
          <div className="video-card lesson-video">
            <div className="video-title"><PlayCircle size={20} /> Vídeo</div>
            <video src={card.video} controls preload="metadata" />
          </div>
        )}
        <div className="remember-box">
          <CheckCircle2 size={18} /> <strong>Recuerda:</strong> {card.remember}
        </div>
      </div>
    </article>
  );
}

function SectionCard({ section, isOpen, onToggle, onOpenPrayer }) {
  const [activeCard, setActiveCard] = useState(0);
  const handleToggle = () => { if (!isOpen) setActiveCard(0); onToggle(); };
  const Icon = section.icon;
  const card = section.cards[activeCard];

  return (
    <article className={`section-card ${isOpen ? 'is-open' : ''}`}>
      <button className="section-head" onClick={handleToggle} aria-expanded={isOpen}>
        <span className="icon-bubble"><Icon size={30} /></span>
        <span className="section-title-wrap">
          <span className="eyebrow">Parte {section.id + 1}</span>
          <span className="section-title">{section.title}</span>
        </span>
        {isOpen ? <ChevronUp className="chevron" /> : <ChevronDown className="chevron" />}
      </button>

      <div className="section-body" hidden={!isOpen}>
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
        <CardActivities card={card} />
      </div>
    </article>
  );
}

const misaData = [
  {
    id: 0,
    title: 'Ritos iniciales',
    icon: Users,
    description: 'Jesús nos reúne.',
    cards: [
      { title: 'Introito y acto penitencial', icon: Heart, image: asset('/fotos/entrada.jpg'), video: asset('/vídeos/1. Introito y acto penitencial.mp4'), text: 'Entramos en la celebración.', remember: 'Jesús me invita y me perdona.', prayer: 'Yo confieso' },
      { title: 'Gloria', icon: Music, image: asset('/fotos/iglesia-llena.jpg'), video: asset('/vídeos/2. Gloria.mp4'), text: 'Alabamos a Dios.', remember: 'La Misa empieza con alegría.', prayer: 'Gloria' },
      { title: 'Oración colecta', icon: MessageCircle, image: asset('/fotos/misal.jpg'), text: 'El sacerdote recoge la oración.', remember: 'Rezo unido a la Iglesia.' }
    ]
  },
  {
    id: 1,
    title: 'Liturgia de la Palabra',
    icon: BookOpen,
    description: 'Jesús nos habla.',
    cards: [
      { title: 'Lecturas', icon: BookOpen, image: asset('/fotos/liturgia palabra.jpg'), video: asset('/vídeos/4. Lecturas.mp4'), text: 'Escuchamos la Biblia.', remember: 'Escuchar es rezar.' },
      { title: 'Evangelio y homilía', icon: Sun, image: asset('/fotos/Evangelio.jpg'), video: asset('/vídeos/5. Homilía.mp4'), text: 'Palabras de Jesús.', remember: 'Jesús me habla.' },
      { title: 'Credo y Oración universal', icon: Heart, image: asset('/fotos/niño_de_rodillas.jpg'), video: asset('/vídeos/9. Petición.mp4'), text: 'Rezamos por todos.', remember: 'Rezamos unidos.', prayer: 'Credo' }
    ]
  },
  {
    id: 2,
    title: 'Liturgia Eucarística',
    icon: Wine,
    description: 'Jesús se hace presente.',
    cards: [
      { title: 'Presentación de las ofrendas', icon: ArrowRight, image: asset('/fotos/Ofrendas.jpg'), video: asset('/vídeos/6. Ofertorio.mp4'), text: 'Se presentan el pan y el vino.', remember: 'Ofrezco mi día.', prayer: 'Bendito seas' },
      { title: 'Plegaria Eucarística', icon: Sparkles, image: asset('/fotos/cáliz.jpg'), video: asset('/vídeos/7. Santo.mp4'), text: 'Acción de gracias.', remember: 'Dios es santo.', prayer: 'Santo' },
      { title: 'Consagración', icon: Wine, image: asset('/fotos/copon.jpg'), video: asset('/vídeos/10. Plegaria eucarística.mp4'), text: 'Transformación.', remember: 'Jesús está presente.', prayer: 'Palabras de la consagración' },
      { title: 'Santos y almas del purgatorio', icon: Users, image: asset('/fotos/interior iglesia.jpg'), video: asset('/vídeos/8. Santos y almas del purgatorio.mp4'), text: 'Unidos a los santos.', remember: 'Gran familia.' },
      { title: 'Padre nuestro', icon: MessageCircle, image: asset('/fotos/dando la mano.jpg'), video: asset('/vídeos/11. Padrenuestro y rito comunión.mp4'), text: 'Oración de Jesús.', remember: 'Dios es Padre.', prayer: 'Padrenuestro' },
      { title: 'Comunión', icon: Wine, image: asset('/fotos/comunión.jpg'), video: asset('/vídeos/12. Comunión.mp4'), text: 'Recibimos a Jesús.', remember: 'Jesús viene a mí.' },
      { title: 'Acción de gracias', icon: Trophy, image: asset('/fotos/papa_caliz.jpg'), video: asset('/vídeos/14. Acción de gracias.mp4'), text: 'Damos gracias.', remember: 'Dar gracias es bueno.' }
    ]
  },
  {
    id: 3,
    title: 'Rito de despedida',
    icon: Send,
    description: 'Jesús nos envía.',
    cards: [
      { title: 'Oración y bendición final', icon: Send, image: asset('/fotos/bendición.jpg'), video: asset('/vídeos/13. Oración y bendición final.mp4'), text: 'Somos enviados.', remember: 'Salgo para amar.' }
    ]
  }
];

export default function App() {
  const [openSection, setOpenSection] = useState(0);
  const [prayerModal, setPrayerModal] = useState(null);
  const [showCover, setShowCover] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="page-shell">
      {prayerModal && (
        <PrayerModal prayerTitle={prayerModal} prayerLines={prayers[prayerModal]} onClose={() => setPrayerModal(null)} />
      )}
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      {showCover ? (
        <header className="hero cover-hero">
          <nav className="cover-topbar">
            <img src={asset('/logo colegio.png')} alt="Logo" className="school-logo cover-logo" />
            <button className="cover-menu" aria-label="Menú">☰</button>
          </nav>
          <div className="cover-content">
            <img src={asset('/fotos/El_cristo_de_san_juan_de_la_cruz.jpg')} alt="Cristo" className="cover-image" />
            <h1>Tanto amó Dios al mundo (Jn 3, 16)</h1>
            <p className="hero-copy cover-copy">Recorre las partes de la Misa.</p>
            <button className="primary-button cover-start" onClick={() => setShowCover(false)}>Empezar</button>
            <button className="cover-info" type="button" onClick={() => setShowInfo(true)}>Más información</button>
            <span className="cover-line" />
          </div>
        </header>
      ) : (
      <main className="app-main">
        <section className="content-section" id="partes">
          <h2 className="eucaristia-heading">La celebración de la Eucaristía</h2>
          <div className="sections-list">
            {misaData.map((section) => (
              <SectionCard key={section.id} section={section} isOpen={openSection === section.id} onToggle={() => setOpenSection(openSection === section.id ? null : section.id)} onOpenPrayer={setPrayerModal} />
            ))}
          </div>
        </section>
      </main>
      )}
    </div>
  );
}
