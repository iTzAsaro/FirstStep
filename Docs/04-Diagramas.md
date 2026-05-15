# Diagramas (Mermaid)

Este documento contiene diagramas técnicos y funcionales relevantes para el proyecto. Los diagramas están escritos en Mermaid para facilitar su versionado.

## 1) Arquitectura del sistema (alto nivel)

```mermaid
flowchart LR
  U[Usuario] -->|HTTP| FE[Frontend\nReact + Vite + TS + Tailwind]

  FE -->|Futuro| API[Backend API\nNode.js + Express + TS]
  API -->|Futuro| DB[(Oracle Database)]

  subgraph Frontend
    FE --> R[Router]
    FE --> UI[UI Kit\nshared/ui]
    FE --> S[Session (mock)\nlocalStorage]
  end
```

## 2) Arquitectura del frontend (FSD)

```mermaid
flowchart TB
  subgraph APP[app]
    Providers[providers]
    Router[router]
    Styles[styles]
  end

  subgraph PAGES[pages]
    Landing[/Landing/]
    Portal[/Portal/]
    LoginTalent[/Login Talento/]
    SignUpTalent[/Registro Talento/]
    Onboarding[/Onboarding/]
    DashTalent[/Dashboard Talento/]
    LoginCompany[/Login Empresa/]
    SignUpCompany[/Registro Empresa/]
    DashCompany[/Dashboard Empresa/]
  end

  subgraph FEATURES[features]
    AuthTalent[auth/login-talent]
    AuthCompany[auth/login-company]
    SignUpT[auth/signup-talent]
    Logout[auth/logout]
    CompleteOnb[onboarding/complete-profile]
  end

  subgraph ENTITIES[entities]
    Session[session]
  end

  subgraph SHARED[shared]
    Config[config/routes]
    UI[ui/*]
    Storage[lib/storage]
  end

  APP --> PAGES
  PAGES --> FEATURES
  FEATURES --> ENTITIES
  ENTITIES --> SHARED
  PAGES --> SHARED
```

## 3) Diagrama de flujo — Acceso desde Landing

```mermaid
flowchart TD
  A[Landing (/)] --> B{Tipo de usuario}
  B -->|Talento| C{Acción}
  B -->|Empresa| D{Acción}

  C -->|Login| C1[/Login Talento (/login)/]
  C -->|Registro| C2[/Registro Talento (/talento/registro)/]

  D -->|Login| D1[/Login Empresa (/empresa/login)/]
  D -->|Registro| D2[/Registro Empresa (/empresa/registro)/]
```

## 4) Diagrama de flujo — Talento (Registro/Login → Onboarding → Dashboard)

```mermaid
flowchart TD
  T0{Talento} --> T1[/Registro Talento/]
  T0 --> T2[/Login Talento/]

  T1 --> T3[Session.loginTalent\n(persistir localStorage)]
  T2 --> T3

  T3 --> T4{onboardingCompleted?}
  T4 -->|No| T5[/Onboarding/]
  T4 -->|Sí| T6[/Dashboard Talento/]
  T5 --> T7[Session.completeOnboarding]
  T7 --> T6
```

## 5) Diagrama de flujo — Empresa (Login/Registro → Dashboard Empresa)

```mermaid
flowchart TD
  E0{Empresa} --> E1[/Login Empresa/]
  E0 --> E2[/Registro Empresa/]

  E1 --> E3[Session.loginCompany\n(persistir localStorage)]
  E2 --> E3

  E3 --> E4[/Dashboard Empresa/]
```

## 6) Casos de uso (actores y funcionalidades)

```mermaid
flowchart LR
  subgraph Actores
    Talent[Actor: Talento]
    Company[Actor: Empresa]
  end

  subgraph Casos_de_Uso
    UC1((Registrarse))
    UC2((Iniciar sesión))
    UC3((Completar onboarding))
    UC4((Ver dashboard))
    UC5((Cerrar sesión))
    UC6((Acceder dashboard empresa))
  end

  Talent --> UC1
  Talent --> UC2
  Talent --> UC3
  Talent --> UC4
  Talent --> UC5

  Company --> UC1
  Company --> UC2
  Company --> UC6
  Company --> UC5
```

## 7) Modelo de datos (ERD propuesto — Oracle)

Este diagrama es una propuesta para cuando se implemente backend/BD.

```mermaid
erDiagram
  USERS ||--o{ USER_PROFILES : has
  COMPANIES ||--o{ COMPANY_USERS : has
  COMPANIES ||--o{ JOB_POSTS : publishes
  USERS ||--o{ APPLICATIONS : applies
  JOB_POSTS ||--o{ APPLICATIONS : receives
  APPLICATIONS ||--o{ INTERVIEWS : schedules

  USERS {
    number user_id PK
    varchar2 email UK
    varchar2 password_hash
    varchar2 role
    date created_at
    date updated_at
  }

  USER_PROFILES {
    number profile_id PK
    number user_id FK
    varchar2 full_name
    varchar2 headline
    varchar2 location
    varchar2 skills_json
    varchar2 onboarding_status
    date updated_at
  }

  COMPANIES {
    number company_id PK
    varchar2 name
    varchar2 industry
    varchar2 size_range
    date created_at
  }

  COMPANY_USERS {
    number company_user_id PK
    number company_id FK
    number user_id FK
    varchar2 permissions
  }

  JOB_POSTS {
    number job_id PK
    number company_id FK
    varchar2 title
    varchar2 description
    varchar2 location
    varchar2 status
    date created_at
  }

  APPLICATIONS {
    number application_id PK
    number user_id FK
    number job_id FK
    varchar2 status
    date created_at
  }

  INTERVIEWS {
    number interview_id PK
    number application_id FK
    date scheduled_at
    varchar2 status
    varchar2 notes
  }
```

## 8) Diagramas de secuencia — Flujos críticos

### 8.1) Registro talento → sesión → onboarding

```mermaid
sequenceDiagram
  autonumber
  actor U as Talento
  participant P as SignUpTalentPage
  participant F as useTalentSignUp (feature)
  participant S as SessionProvider (entity)
  participant LS as localStorage
  participant R as Router

  U->>P: Completa email + password (mock)
  U->>P: Submit
  P->>F: signUp({email})
  F->>S: loginTalent({email})
  S->>LS: write firststep.session.v1
  F->>R: navigate(/onboarding)
```

### 8.2) Login empresa → sesión → dashboard empresa

```mermaid
sequenceDiagram
  autonumber
  actor U as Empresa
  participant P as LoginCompanyPage
  participant F as useCompanyLogin (feature)
  participant S as SessionProvider (entity)
  participant LS as localStorage
  participant R as Router

  U->>P: Completa companyName + email + password (mock)
  U->>P: Submit
  P->>F: login({companyName,email})
  F->>S: loginCompany({companyName,email})
  S->>LS: write firststep.session.v1
  F->>R: navigate(/empresa/dashboard)
```

### 8.3) Acceso a ruta protegida

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario
  participant R as Router
  participant PR as ProtectedRoute
  participant S as SessionProvider

  U->>R: Navega a ruta protegida
  R->>PR: Render ProtectedRoute(role?)
  PR->>S: Lee session.isAuthenticated y session.role
  alt No autenticado
    PR-->>R: Navigate(/portal)
  else Rol incorrecto
    PR-->>R: Navigate(/portal)
  else OK
    PR-->>R: Render children (page)
  end
```
