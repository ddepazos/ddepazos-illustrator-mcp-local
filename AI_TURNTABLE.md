# Pazos AI Turntable · módulo 0.1.0 / suite 0.10.0

Illustrator 2023 es la interfaz; GitHub distribuye y valida el código; Drive intercambia archivos privados; Colab ejecuta el worker. Es independiente de Turntable Local y del repositorio del portafolio.

**Este primer adaptador es de prueba.** Devuelve copias transparentes rotuladas del PNG, no vistas nuevas ni geometría 3D. Usa CPU incluso si Colab tiene GPU. La interfaz permite sustituirlo por un modelo multivista real más adelante; no incluye pesos ni promete generación IA real en esta versión.

## Instalar en Windows

**Ruta recomendada sin comandos:** en GitHub abre **Actions → Package Pazos Vector Tools → ejecución verde → Artifacts → pazos-vector-tools**. Descarga, extrae el contenido y extrae también `pazos-vector-tools-suite.zip`. Haz doble clic en **Instalar-Pazos-Tools.cmd** y sigue el mensaje. No requiere abrir una consola ni copiar comandos. Si los cambios están todavía en un pull request, puedes aceptarlos con **Merge pull request** cuando las comprobaciones estén verdes; el notebook publicado usa `main` y necesita esa integración previa. La alternativa por PowerShell sigue disponible debajo.

1. Cierra Illustrator. En PowerShell, dentro de tu copia de `ddepazos-illustrator-mcp-local`, ejecuta:

   ```powershell
   git pull --ff-only
   powershell -NoProfile -ExecutionPolicy Bypass -File .\install-all-panels.ps1
   ```

   También puedes descargar y extraer el artefacto `pazos-vector-tools` de una ejecución verde de **Package Pazos Vector Tools** en GitHub Actions; extrae `pazos-vector-tools-suite.zip` y ejecuta el mismo instalador desde esa carpeta. Para instalar solo este panel usa `install-ai-turntable.ps1`.
2. Abre Illustrator 2023 → Ventana → Extensiones (heredadas) → **Pazos AI Turntable**. El instalador conserva los otros paneles y habilita CEP 11 para el usuario.
3. Con Google Drive para escritorio, crea `Mi unidad/Pazos_AI_Turntable` y hazla disponible sin conexión. Pulsa **Configurar carpeta de Drive** y selecciona su ruta local. Debe estar fuera de cualquier repositorio Git. Se crean `queue/`, `processing/`, `output/`, `logs/`. La configuración se guarda en `%APPDATA%/Pazos/ai-turntable.json`, fuera de la extensión y del repositorio.

## Iniciar Colab desde Illustrator

1. Pulsa **Abrir notebook Colab**. Abre `colab/Pazos_AI_Turntable.ipynb` desde la rama `main` del repo.
2. Conecta el runtime, ejecuta todas las celdas y autoriza el montaje de Drive. La ruta predeterminada es `/content/drive/MyDrive/Pazos_AI_Turntable`: debe corresponder a la carpeta elegida en Windows. El adaptador inicial necesita solo CPU. Para un futuro modelo GPU, cambia el acelerador y sus dependencias según su documentación.
3. Deja ejecutándose la última celda. El notebook clona/actualiza el código público, instala dependencias y procesa trabajos mientras la sesión esté viva. Solo una sesión/worker por carpeta Drive.
4. En Illustrator, selecciona uno o más objetos, indica vistas/tilt/tamaño y pulsa **Generar Turntable IA**. No modifica el original: exporta la selección mediante un documento temporal.
5. Observa `queued → processing → done/error`, X/Y, worker y GPU. Cuando aparezca `done`, pulsa **Importar vistas**. Se verifica la integridad de todos los PNG antes de importar; si Drive no ha terminado, espera y repite. Se embeben en una nueva capa, en grilla debajo de la mesa activa. La casilla permite una mesa por vista.

Colab Free puede requerir iniciar/conectar y autorizar Drive manualmente en cada nueva sesión. No garantiza GPU, duración ni operación permanente. Google restringe workers distribuidos y usos que eluden la interfaz del notebook; esta integración experimental no garantiza que Free admita su uso continuado. Mantén el notebook como sesión interactiva; no hay keep-alive, reconexión automática ni bypass. Consulta la [FAQ oficial de Colab](https://research.google.com/colaboratory/faq.html). GitHub Actions no inicia sesiones de Colab.

## Contrato de archivos y recuperación

- `queue/<job_id>/artwork.png`: selección exportada, máximo 2048 px por lado desde el panel.
- `queue/<job_id>/job.json`: `job_id`, `views` (1–36), `tilt` (-90–90), `size` (128–2048), `mode`, `output_dir`, `state: queued`, `created_at`, `artwork_sha256`. Se publica al final, después del PNG. `output_dir` debe ser exactamente `output/<job_id>`.
- `processing/<job_id>/job.json`: registro de claim, actualizado a `processing`, `done` o `error`. Se conserva el input en queue para evitar pérdidas al mover archivos en Drive. Un registro terminal excluye el trabajo de nuevas ejecuciones.
- `output/<job_id>/progress.json`: estado, `completed`, `total`, hora y posible error.
- `output/<job_id>/manifest.json`: estado terminal, lista ordenada `views: [{file, sha256}]`, versión y señal `is_test`.
- `worker-status.json`: señal cada 15 segundos, runtime, GPU detectada, adaptador y trabajo activo. Tras 90 segundos sin señal el panel lo considera desconectado. GPU detectada no significa GPU utilizada.
- `logs/<job_id>.json`: resultado; nunca se publica en GitHub.

Drive no garantiza orden de sincronización. El worker espera hasta 120 segundos después de detectar el job para obtener una entrada válida; errores persistentes terminan como `error`. Después de una desconexión, reinicia Colab. Si el trabajo quedó en processing sin manifiesto terminal, se marca interrumpido: vuelve a enviarlo desde Illustrator con un ID nuevo. Los jobs terminados no se repiten. Si una señal anterior sigue reciente, espera 90 segundos antes de reiniciar. El bloqueo del sistema protege launches duplicados en una VM; **Drive no proporciona un bloqueo distribuido fiable entre dos sesiones**.

La carpeta local accesible no demuestra sincronización con la nube. Configura Drive correctamente y comprueba el cliente de escritorio cuando un estado tarde. El panel consulta JSON cada 5 segundos (Manager cada 10) y suspende consultas oculto; no usa animación, render continuo ni carga imágenes durante polling. Los hashes se calculan solo al enviar/importar.

## Sustituir el adaptador

Implementa `generate(artwork: Path, job: dict)` en `ai-worker/model_adapter.py`, que produzca `(index, imagen PIL RGBA)` en orden, exactamente `views` resultados. Inicializa pesos una vez por instancia; respeta `size`, `tilt`, orden angular y modo. Registra el nuevo modo explícitamente en `create_adapter`, validación del worker y controles del panel. Actualiza `is_test`, `uses_gpu`, nombre y dependencias cuando haya un modelo real; hoy se declaran deliberadamente como prueba/CPU. El worker conserva la responsabilidad de rutas, progreso, errores y manifiesto. No ejecutes código, comandos ni URLs recibidas dentro de jobs.

## Privacidad, GitHub y validación

No hay tokens, claves ni despacho de obras a Actions. El panel no usa APIs de subida. GitHub maneja commits, versiones, validación y paquetes de código con lista explícita; no recibe `.ai`, PNG, SVG ni assets del flujo nuevo. Los jobs deben permanecer fuera del checkout. `.gitignore` añade defensa para colas/resultados accidentales; no reemplaza revisar tus commits manuales. El renderer local anterior conserva su comportamiento existente y está separado de este flujo.

Tools Manager muestra instalación, versión de AI Turntable, Drive, worker/Colab, GPU y cola. Su botón de GitHub comprueba versión remota y Actions sin credenciales. Un fallo de red o límite API no bloquea trabajos locales.

Validación local (Python 3.10+ y Node 18+):

```powershell
python -m pip install -r ai-worker/requirements.txt nbformat
python -m compileall -q ai-worker
python tests/validate_ai.py
python -m unittest discover -s tests -p "test_*.py"
node tests/test-bridge.cjs
```

Prueba manual en Illustrator requerida: exportar grupo y selección múltiple, comprobar transparencia/límites, simular Drive pausado, iniciar/detener Colab, importar grilla con/sin mesas y comprobar que el documento original no cambió. La automatización sintáctica no sustituye esta prueba con Adobe ni una sesión real de Colab/Drive.
