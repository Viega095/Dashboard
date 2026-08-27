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
        title: "Bienvenido/a a tus Notas",
        content: "Aquí puedes escribir tus ideas, recordatorios rápidos o guardar enlaces web.",
        date: new Date().toLocaleDateString('es-AR'),
        colorClass: "note-card-green"
    }
];

const defaultTareas = [
    { id: "t1", text: "Explorar las herramientas de mi nuevo Dashboard", completed: false }
];

const defaultHabits = {
    list: [
        { id: "h1", name: "Ejercicio / Rutina", color: "tile-blue" },
        { id: "h2", name: "Estudio / Lectura", color: "tile-purple" }
    ],
    records: {}
};

const defaultSubjectsData = [
    {
        id: "sub_1",
        name: "Materia de Ejemplo",
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
            { title: "1° Examen Parcial", dates: "2026-09-15" }
        ]
    }
];

const defaultHorarioExactData = [
    {
        id: "sch_1",
        day: "lunes",
        startTime: "18:00",
        endTime: "20:00",
        title: "Cursado de Ejemplo",
        category: "facultad",
        details: "Aula / Espacio de Estudio"
    }
];
