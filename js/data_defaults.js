/* ==========================================
   DEFAULT CONFIGURATION & PRESETS DATA
   100% Generic & Clean Placeholders
   ========================================== */

const defaultUserConfig = {
    userName: "Usuario",
    theme: "dark",
    bgUrl: "",
    bgOpacity: 30,
    sidebarCollapsed: false,
    activeModules: {
        facultad: true,
        gimnasio: true,
        tareas: true,
        finanzas: true,
        notas: true,
        horario: true,
        bookmarks: true
    }
};

const presetBookmarksList = [
    { name: "Google", url: "https://google.com", icon: "ph-magnifying-glass" },
    { name: "YouTube", url: "https://youtube.com", icon: "ph-youtube-logo" },
    { name: "ChatGPT", url: "https://chat.openai.com", icon: "ph-robot" },
    { name: "GitHub", url: "https://github.com", icon: "ph-github-logo" },
    { name: "Gmail", url: "https://mail.google.com", icon: "ph-envelope-simple" },
    { name: "Notion", url: "https://notion.so", icon: "ph-article" }
];

const defaultBookmarks = [
    { id: "bm_1", name: "Google", url: "https://google.com", icon: "ph-magnifying-glass" },
    { id: "bm_2", name: "YouTube", url: "https://youtube.com", icon: "ph-youtube-logo" },
    { id: "bm_3", name: "ChatGPT", url: "https://chat.openai.com", icon: "ph-robot" }
];

const defaultNotes = [
    {
        id: "n1",
        title: "Bienvenido a tus Notas",
        content: "Aquí puedes escribir tus ideas, recordatorios o guardar enlaces web.",
        date: new Date().toLocaleDateString('es-AR'),
        colorClass: "note-card-green"
    },
    {
        id: "n2",
        title: "Apuntes: Materia de Ejemplo 1",
        content: "Espacio para tus apuntes, temas a repasar y anotaciones importantes.",
        date: new Date().toLocaleDateString('es-AR'),
        colorClass: "note-card-cyan"
    }
];

const defaultTareas = [
    { id: "t1", text: "Organizar mis pendientes de la semana", completed: false },
    { id: "t2", text: "Probar las funciones de mi nuevo Dashboard", completed: true }
];

const defaultHabits = {
    list: [
        { id: "h1", name: "Ejercicio / Rutina", color: "tile-blue" },
        { id: "h2", name: "Lectura Diaria", color: "tile-purple" },
        { id: "h3", name: "Estudio / Enfoque", color: "tile-cyan" }
    ],
    records: {}
};

const defaultSubjectsData = [
    {
        id: "sub_1",
        name: "Materia de Ejemplo 1",
        professor: "Cátedra / Profesor",
        driveLink: "",
        campusUrl: "",
        programaUrl: "",
        cronogramaUrl: "",
        biblioUrl: "",
        anunciosUrl: "",
        weeksCount: 16,
        currentWeek: 1,
        weeksState: { "1": true },
        notesContent: "Espacio para tus apuntes, temas a repasar y anotaciones importantes.",
        grades: { p1: "", p2: "", tp: "" },
        events: [
            { title: "1° Examen Parcial", dates: "2026-09-15" },
            { title: "2° Examen Parcial", dates: "2026-11-10" }
        ]
    },
    {
        id: "sub_2",
        name: "Materia de Ejemplo 2",
        professor: "Cátedra / Profesor",
        driveLink: "",
        campusUrl: "",
        programaUrl: "",
        cronogramaUrl: "",
        biblioUrl: "",
        anunciosUrl: "",
        weeksCount: 16,
        currentWeek: 1,
        weeksState: {},
        notesContent: "Espacio para notas y temas de estudio...",
        grades: { p1: "", p2: "", tp: "" },
        events: [
            { title: "1° Examen Parcial", dates: "2026-09-20" }
        ]
    }
];

const defaultHorarioExactData = [
    {
        id: "sch_1",
        day: "lunes",
        startTime: "18:35",
        endTime: "21:00",
        title: "Trabajo / Turno",
        category: "trabajo",
        details: "Turno Tarde"
    },
    {
        id: "sch_2",
        day: "miercoles",
        startTime: "18:35",
        endTime: "21:00",
        title: "Trabajo / Turno",
        category: "trabajo",
        details: "Turno Tarde"
    },
    {
        id: "sch_3",
        day: "martes",
        startTime: "09:00",
        endTime: "12:00",
        title: "Cursado Materia 1",
        category: "facultad",
        details: "Aula 204"
    },
    {
        id: "sch_4",
        day: "jueves",
        startTime: "14:00",
        endTime: "15:30",
        title: "Gimnasio / Entrenamiento",
        category: "gimnasio",
        details: "Rutina Fuerza"
    }
];
