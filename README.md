# 🎓 Estudio360 — Plataforma Educativa · Despliegue Netlify

![React](https://img.shields.io/badge/React%2019-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Backend%20%2F%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-Desplegado-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)
![Estado](https://img.shields.io/badge/Estado-Publicado-4CAF50?style=for-the-badge)
![Tipo](https://img.shields.io/badge/Práctica-No%20Code%20%2F%20Low%20Code-FF6B6B?style=for-the-badge)

> **Ejercicio Práctico — Creación de Apps No Code y Low Code**  
> Plataforma educativa para profesores y alumnos desplegada en **Netlify**

---

## 🔗 Acceso a la Aplicación

[![Ver App en Producción](https://img.shields.io/badge/🚀%20Ver%20App%20en%20Producción-estudio--360.lovable.app-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://estudio-360-smart-learn.lovable.app/)

> ℹ️ **Variante de despliegue:** Este repositorio usa el preset **`netlify`** con SSR y Edge Functions. Existe una [variante con despliegue en Vercel](https://github.com/migueljerico/estudio-360-smart-learn-vercel) del mismo proyecto.

---

## 📋 Descripción del Proyecto

**Estudio360** conecta profesores y alumnos en un flujo de estudio estructurado. Los profesores crean tarjetas y cuestionarios, los organizan en clases y los asignan a sus alumnos; los alumnos estudian el contenido asignado, reciben feedback inmediato y pueden repasar solo las tarjetas falladas. La aplicación diferencia automáticamente el panel de cada usuario según el rol seleccionado en el registro.

---

## ✨ Funcionalidades principales

### 👩‍🏫 Para profesores

| Sección | Descripción |
|---|---|
| **Panel** | Resumen de tarjetas, cuestionarios, clases e intentos recientes |
| **Biblioteca** | Gestión del contenido propio; duplicar o eliminar tarjetas y cuestionarios |
| **Clases y alumnos** | Creación de clases; los alumnos se añaden con su ID de usuario |
| **Tarjetas** | Editor de decks de flashcards con frente y reverso |
| **Cuestionarios** | Editor de opción múltiple con corrección automática |
| **Alumnos** | Vista del progreso individual de cada estudiante |

### 🎒 Para alumnos

| Sección | Descripción |
|---|---|
| **Panel** | Tarjetas y cuestionarios asignados, porcentaje global de aciertos |
| **Estudio de tarjetas** | Modo flip-card con botones "La sabía / No la sabía" + repaso de fallos |
| **Cuestionarios** | Preguntas de opción múltiple con corrección visual inmediata |
| **Historial** | Lista de todos los intentos con puntuación y fecha |
| **Resultados** | Vista detallada de cada intento |

---

## 🏗️ Arquitectura del proyecto

```
src/
├── routes/                      # Páginas (file-based routing — TanStack Router)
│   ├── index.tsx                # Landing pública
│   ├── login.tsx                # Login / registro con selección de rol
│   ├── app.tsx                  # Layout autenticado con sidebar
│   ├── app.index.tsx            # Panel (diferente según rol)
│   ├── app.library.tsx          # Biblioteca de contenido
│   ├── app.classes.tsx          # Gestión de clases
│   ├── app.study.deck.$id.tsx   # Modo estudio flashcards
│   └── app.study.quiz.$id.tsx   # Modo cuestionario
├── integrations/supabase/       # Cliente Supabase + helpers de auth
├── components/
│   ├── AppSidebar.tsx
│   └── ui/                      # Componentes shadcn/ui
└── lib/
    └── auth-context.tsx         # Contexto de sesión y rol
```

---

## ⚙️ Configuración de despliegue — Netlify

El proyecto usa **Nitro** con preset `netlify` para SSR + Edge Functions:

```ts
// vite.config.ts
export default defineConfig({
  tanstackStart: { server: { entry: "server" } },
  nitro: { preset: "netlify" },
});
```

### Variables de entorno requeridas

```env
VITE_SUPABASE_URL=        # URL del proyecto Supabase
VITE_SUPABASE_ANON_KEY=   # Clave anónima de Supabase
```

### Desarrollo local

```bash
bun install
netlify dev --port 8889   # Emula SSR y Edge Functions en local
```

---

## 🧰 Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Framework** | TanStack Start — React 19 + SSR |
| **Enrutamiento** | TanStack Router (file-based) |
| **Estilos** | Tailwind CSS v4 + shadcn/ui |
| **Backend / Auth / DB** | Supabase (PostgreSQL + Auth) |
| **Bundler** | Vite 7 + Nitro (`preset: netlify`) |
| **Despliegue** | Netlify (SSR + Edge Functions) |
| **Gestor de paquetes** | Bun |

---

## 📚 Contexto formativo

Este ejercicio forma parte del programa de formación en **Análisis de Datos**, dentro del módulo de creación de aplicaciones no-code y low-code. El objetivo es construir y desplegar una aplicación web funcional con roles diferenciados, autenticación real y base de datos conectada.

**Repositorio relacionado:** [Estudio360 — Variante Vercel](https://github.com/migueljerico/estudio-360-smart-learn-vercel) — misma app, configuración `preset: vercel` con `vercel.json`.

---

<p align="center">
  <sub>Desarrollado por <a href="https://github.com/migueljerico">@migueljerico</a> · 2026</sub>
</p>
