# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a **Pacha-Chain-Origin**! Este documento explica cómo participar de forma efectiva.

---

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo puedo contribuir?](#cómo-puedo-contribuir)
- [Configuración del entorno](#configuración-del-entorno)
- [Flujo de trabajo](#flujo-de-trabajo)
- [Estándares de código](#estándares-de-código)
- [Commits convencionales](#commits-convencionales)
- [Pull Requests](#pull-requests)

---

## Código de Conducta

Este proyecto sigue el [Código de Conducta](CODE_OF_CONDUCT.md). Al participar aceptas cumplirlo.

---

## ¿Cómo puedo contribuir?

### 🐛 Reportar Bugs

1. Verifica que no exista un [issue abierto](https://github.com/KRSNA-BLR/Pacha-Chain-Origin/issues) similar.
2. Usa la plantilla de **Bug Report** al crear el issue.
3. Incluye pasos claros para reproducir, versión del entorno y logs relevantes.

### 💡 Proponer Mejoras

1. Abre un issue con la plantilla de **Feature Request**.
2. Describe el problema que resuelve, no solo la solución propuesta.
3. Espera discusión antes de empezar la implementación.

### 📖 Mejorar Documentación

Correcciones de typos, mejoras de claridad o traducciones son siempre bienvenidas. Puedes enviar un PR directamente.

### 🔧 Contribuir Código

Revisa los issues etiquetados como `good first issue` o `help wanted` para empezar.

---

## Configuración del entorno

### Prerrequisitos

| Herramienta | Versión Mínima |
|-------------|---------------|
| **Foundry** | Última estable |
| **Node.js** | ≥ 18.x |
| **pnpm / npm** | Última estable |
| **Git** | ≥ 2.x |

### Instalación

```bash
# 1. Fork y clona el repositorio
git clone https://github.com/<tu-usuario>/Pacha-Chain-Origin.git
cd Pacha-Chain-Origin

# 2. Instala dependencias de Solidity
forge install

# 3. Instala dependencias del frontend
cd frontend && npm install && cd ..

# 4. Copia variables de entorno
cp .env.example .env

# 5. Ejecuta los tests
forge test
cd frontend && npm run lint && cd ..
```

---

## Flujo de trabajo

1. **Crea una rama** desde `main`:
   ```bash
   git checkout -b tipo/descripcion-corta
   ```
   Tipos: `feat/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`.

2. **Implementa** tus cambios con tests correspondientes.

3. **Verifica** que todo pase:
   ```bash
   forge test                    # Smart contracts
   cd frontend && npm run lint   # Linting frontend
   cd frontend && npm run build  # Build frontend
   ```

4. **Commit** siguiendo los commits convencionales (ver abajo).

5. **Push** y abre un Pull Request.

---

## Estándares de código

### Solidity

- Versión del compilador: `^0.8.24`
- Seguir las [convenciones de Solidity](https://docs.soliditylang.org/en/latest/style-guide.html)
- NatSpec completo en funciones públicas/externas
- Tests con cobertura para cada función nueva

### TypeScript / React

- ESLint 9 con plugin SonarJS habilitado
- Componentes funcionales con TypeScript estricto
- Hooks personalizados para lógica reutilizable
- Nombres descriptivos en inglés para variables y funciones

---

## Commits convencionales

Seguimos la especificación [Conventional Commits](https://www.conventionalcommits.org/):

```
tipo(alcance): descripción breve

[cuerpo opcional]

[footer opcional]
```

### Tipos permitidos

| Tipo | Descripción |
|------|-------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Solo documentación |
| `style` | Formato (sin cambios de lógica) |
| `refactor` | Reestructuración sin cambio funcional |
| `test` | Agregar o corregir tests |
| `chore` | Tareas de mantenimiento |
| `ci` | Cambios en CI/CD |

### Ejemplos

```
feat(contract): add batch expiration validation
fix(frontend): resolve QR scanner memory leak
docs: update deployment guide for Polygon Amoy
ci: add Trivy container scanning step
```

---

## Pull Requests

### Antes de enviar

- [ ] Tests pasan localmente (`forge test`)
- [ ] Sin errores de lint (`npm run lint` en `frontend/`)
- [ ] Build exitoso (`npm run build` en `frontend/`)
- [ ] Sin secretos expuestos (ejecutar `gitleaks detect`)
- [ ] Documentación actualizada si aplica

### Proceso de revisión

1. Al menos **1 aprobación** requerida.
2. CI debe pasar completamente (todos los jobs verdes).
3. Los comentarios de revisión deben ser resueltos antes del merge.
4. Se usa **Squash & Merge** para mantener el historial limpio.

---

## ⚖️ Licencia

Al contribuir, aceptas que tus contribuciones se licencien bajo la misma [PolyForm Noncommercial License 1.0.0](LICENSE) del proyecto.

---

<div align="center">

**¿Preguntas?** Abre un [Discussion](https://github.com/KRSNA-BLR/Pacha-Chain-Origin/discussions) 💬

</div>
