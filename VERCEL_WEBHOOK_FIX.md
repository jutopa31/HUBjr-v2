# Vercel Webhook Fix Guide

## 🔍 Diagnóstico Completado

**Problema Identificado**:
- No hay webhooks configurados en el repositorio GitHub
- Vercel no está detectando commits automáticamente
- La integración Vercel ↔ GitHub está rota o no existe

---

## ✅ Solución: Configurar Integración de Vercel con GitHub

### Método 1: Re-conectar Vercel con GitHub (Recomendado)

#### Paso 1: Ir a Vercel Dashboard
1. Ve a: https://vercel.com/dashboard
2. Haz login si es necesario

#### Paso 2: Seleccionar tu Proyecto
1. Busca el proyecto **"hubjr"** o **"HUBjr-v2"** en la lista
2. Haz clic en el proyecto

#### Paso 3: Ir a Settings
1. En el proyecto, haz clic en **"Settings"** (arriba a la derecha)
2. Ve a la sección **"Git"** en el menú lateral

#### Paso 4: Verificar Conexión GitHub
Deberías ver:
- **Connected Git Repository**: `jutopa31/HUBjr-v2`
- **Production Branch**: `main`

**Si NO aparece nada:**
1. Haz clic en **"Connect Git Repository"**
2. Selecciona **GitHub**
3. Autoriza Vercel si es necesario
4. Selecciona el repositorio **jutopa31/HUBjr-v2**

#### Paso 5: Configurar Auto-Deploy
En **Settings → Git**:
- ✅ Marca: **"Deploy on Push"** (auto-deploy cuando hagas push)
- ✅ Production Branch: **main**
- ✅ Preview Deployments: **Enabled** (opcional)

---

### Método 2: Reinstalar Vercel GitHub App

#### Paso 1: Ir a GitHub Settings
1. Ve a: https://github.com/settings/installations
2. Busca **"Vercel"** en la lista de aplicaciones instaladas

#### Paso 2: Verificar Permisos
1. Haz clic en **"Configure"** junto a Vercel
2. Verifica que **jutopa31/HUBjr-v2** esté en la lista de repositorios
3. Si NO está:
   - Selecciona **"All repositories"** O
   - Agrega **HUBjr-v2** manualmente en **"Select repositories"**
4. Haz clic en **"Save"**

#### Paso 3: Verificar Webhook en GitHub
1. Ve a: https://github.com/jutopa31/HUBjr-v2/settings/hooks
2. Deberías ver un webhook de Vercel:
   - **Payload URL**: `https://api.vercel.com/v1/integrations/...`
   - **Status**: ✅ (check verde)

**Si NO hay webhook o tiene error**:
1. Elimina el webhook roto (si existe)
2. Ve a Vercel dashboard
3. Desconecta y reconecta el repositorio (Método 1)

---

### Método 3: Crear Proyecto Nuevo en Vercel (Solo si todo lo demás falla)

#### Opción A: Desde Vercel Dashboard
1. Ve a: https://vercel.com/new
2. Selecciona **"Import Git Repository"**
3. Conecta GitHub si es necesario
4. Busca **jutopa31/HUBjr-v2**
5. Configura:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (raíz del proyecto)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
6. Agrega variables de entorno (si las necesitas):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Haz clic en **"Deploy"**

**IMPORTANTE**: Si creas un proyecto nuevo, actualiza el dominio en tu app.

---

## 🧪 Verificar que Funciona

### Test 1: Hacer un Commit de Prueba
```bash
# En tu terminal local
git commit --allow-empty -m "test: verify Vercel auto-deploy"
git push origin main
```

### Test 2: Monitorear en Vercel
1. Ve a: https://vercel.com/dashboard
2. Abre tu proyecto
3. Deberías ver un nuevo deployment aparecer en **segundos**
4. Status debería cambiar: `Building` → `Ready`

### Test 3: Verificar Webhook en GitHub
1. Ve a: https://github.com/jutopa31/HUBjr-v2/settings/hooks
2. Haz clic en el webhook de Vercel
3. Ve a la pestaña **"Recent Deliveries"**
4. Deberías ver tu último push con **✅ Success** (código 200)

---

## 🐛 Troubleshooting

### Problema: Webhook aparece pero con error ❌

**Solución**:
1. Ve a Recent Deliveries en el webhook
2. Haz clic en el delivery fallido
3. Lee el error (usualmente es problema de permisos)
4. Re-instala la GitHub App (Método 2)

### Problema: Deployment manual funciona pero auto-deploy no

**Solución**:
1. Ve a Vercel Settings → Git
2. Verifica que **"Deploy on Push"** esté activado
3. Verifica que la branch sea **"main"** (no "master")

### Problema: "This project is not connected to a Git repository"

**Solución**:
1. El proyecto fue creado manualmente o la conexión se rompió
2. Usa Método 1 para reconectar
3. O crea proyecto nuevo (Método 3)

---

## 📋 Checklist Final

Después de configurar, verifica:

- [ ] Webhook existe en GitHub: https://github.com/jutopa31/HUBjr-v2/settings/hooks
- [ ] Webhook tiene status ✅ verde
- [ ] Vercel Settings → Git muestra el repo conectado
- [ ] "Deploy on Push" está activado en Vercel
- [ ] Production Branch es "main"
- [ ] Haz un commit de prueba y aparece en Vercel automáticamente
- [ ] SessionGuard se deployó correctamente (https://hubjr.vercel.app)

---

## 🎯 Próximos Pasos

Una vez que el webhook funcione:

1. **Commits ya listos para deployar**:
   ```
   705ccfd - chore: trigger Vercel deployment
   304baa9 - fix(deploy): add SessionGuard to Next.js
   22ec234 - fix(auth): implement SessionGuard
   ```

2. **Verificar SessionGuard en producción**:
   - Abre https://hubjr.vercel.app
   - Abre DevTools (F12) → Console
   - Busca: `[SessionGuard] Starting session validation...`

3. **Probar bootloop fix**:
   - Simula sesión stale: `localStorage.setItem('supabase.auth.token', 'invalid')`
   - Recarga página (F5)
   - Debería limpiar automáticamente sin bootloop

---

**Creado**: 2025-10-20
**Problema**: Webhook GitHub → Vercel no configurado
**Solución**: Seguir cualquiera de los 3 métodos arriba
