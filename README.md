# FLOCI - Suite de Reconocimiento con Servicios AWS

Aplicación web desarrollada en **Node.js** y **Express** para el análisis inteligente de imágenes y extracción de texto en documentos PDF, integrando **AWS Rekognition** y **AWS Textract**. El proyecto incluye simulación y personalización de respuestas mediante **`aws-sdk-client-mock`** para pruebas locales y académicas sin costos de nube.

---

## Tecnologías y Servicios Utilizados

| Herramienta / Servicio | Función Principal |
| :--- | :--- |
| **Node.js & Express** | Servidor web backend y definición de rutas REST API. |
| **AWS Rekognition (`@aws-sdk/client-rekognition`)** | Detección de etiquetas, personas y objetos en imágenes (`DetectLabelsCommand`). |
| **AWS Textract (`@aws-sdk/client-textract`)** | Detección y extracción de líneas de texto en documentos PDF (`DetectDocumentTextCommand`). |
| **`aws-sdk-client-mock`** | Interceptor de pruebas para simular y personalizar respuestas de AWS en entornos locales. |
| **Multer** | Middleware para procesar la subida de archivos en memoria (`MemoryStorage`), validando formatos y límite estricto de tamaño (< 5 MB). |
| **Bulma CSS** | Framework de estilos CSS moderno para una interfaz limpia, responsiva y profesional. |

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu computadora:
* **Node.js** (versión 18 o superior recomendada).
* **Git** para clonar el repositorio.

---

## Guía de Instalación y Puesta en Marcha

Sigue estos pasos para tener el proyecto corriendo en tu entorno local:

### 1. Clonar el repositorio
Abre tu terminal (PowerShell o Git Bash) y clona el proyecto:
```bash
git clone https://github.com/tu-usuario/floci_reconocimiento.git
cd floci_reconocimiento
```

### 2. Instalar dependencias
Instala todas las librerías necesarias ejecutando:
```bash
npm install
```
*(Si necesitas reinstalar manualmente los paquetes de AWS por separado, puedes ejecutar `npm install @aws-sdk/client-rekognition @aws-sdk/client-textract`)*.

---

## Configuración de Variables de Entorno (.env)

El proyecto utiliza un archivo `.env` para gestionar credenciales y configuraciones sensibles sin exponerlas en el código.

1. En la raíz del proyecto existe un archivo llamado `.env.example`.
2. Crea una copia de ese archivo y renómbrala como `.env`:
   ```bash
   cp .env.example .env
   ```
   *(O cópialo manualmente en el explorador de Windows)*.

3. Configura las variables dentro de tu archivo `.env`:

```env
# Credenciales de acceso AWS (para pruebas con LocalStack o Mock puedes usar 'test')
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Región predeterminada de AWS
AWS_REGION=us-east-1

# Puerto en el que se ejecutará el servidor local
PORT=3000
```

### Explicación de las variables:
* **`AWS_ACCESS_KEY_ID`**: Clave de acceso pública de tu usuario IAM de AWS (o `'test'` en LocalStack).
* **`AWS_SECRET_ACCESS_KEY`**: Clave secreta privada de tu usuario IAM de AWS (o `'test'` en LocalStack).
* **`AWS_REGION`**: Región geográfica del centro de datos de AWS (por ejemplo, `us-east-1`).
* **`PORT`**: Puerto HTTP donde escuchará Express (por defecto `3000`).

---

## Ejecutar la Aplicación

Para iniciar el servidor, ejecuta:

```bash
node server.js
```

Verás en la terminal el mensaje de confirmación:
```
Servidor ejecutandose en http://localhost:3000
```

Abre tu navegador web y entra a:
**http://localhost:3000**

---

## Pruebas de los Servicios

La interfaz web ofrece dos módulos independientes:

### 1. AWS Rekognition (Análisis de Imágenes)
* **Formatos soportados:** Archivos de imagen (`.jpg`, `.png`, `.jpeg`).
* **Endpoint:** `POST /api/analizar`
* **Resultado:** Devuelve etiquetas detectadas con porcentaje de confianza (por ejemplo: *Hombre - 99.4%*, *Niño - 95.4%*).

### 2. AWS Textract (Análisis de Documentos PDF)
* **Formatos soportados:** Exclusivamente documentos `.pdf`.
* **Límite de tamaño:** **Menor a 5 MB** (`< 5,242,880 bytes`).
  > **Validación en tiempo real:** Si seleccionas un archivo de 5 MB o más, el sistema muestra una advertencia inmediata y reinicia el campo para que selecciones uno válido.
* **Endpoint:** `POST /api/analizar-documento`
* **Resultado:** Extrae las líneas de texto detectadas con su nivel de confianza (por ejemplo: *floci - 99.9%*, *Certificado Aprobado - 98.5%*).

---

## Simulación de Respuestas con Mock (aws-sdk-client-mock)

El backend cuenta con mocks configurados para simular respuestas sin necesidad de consumir saldo en AWS:

* **Modo Mock (Pruebas personalizadas):**
  En `server.js` puedes descomentar el bloque `textractMock` para personalizar el texto que deseas que devuelva:
  ```javascript
  textractMock.on(DetectDocumentTextCommand).resolves({
    Blocks: [
      { BlockType: "LINE", Text: "floci", Confidence: 99.9 },
      { BlockType: "LINE", Text: "Certificado Aprobado", Confidence: 98.5 }
    ]
  })
  ```

* **Modo Real (Producción / LocalStack):**
  Al comentar las líneas del mock, el cliente `textractClient.send(command)` procesa el documento contra el servicio de AWS o LocalStack configurado en tu archivo `.env`.

---

## Estructura del Proyecto

```plaintext
floci_reconocimiento/
├── public/
│   ├── index.html         # Interfaz web con Bulma CSS y lógica frontend
│   └── styles.css         # Estilos visuales personalizados
├── .env                   # Variables de entorno locales (ignorado en git)
├── .env.example           # Plantilla de ejemplo para variables de entorno
├── .gitignore             # Archivos excluidos del control de versiones (node_modules, .env)
├── package.json           # Dependencias y scripts del proyecto
├── server.js              # Servidor Express, configuración de AWS SDK v3 y Multer
└── README.md              # Documentación oficial del proyecto
```

---

## Autor y Proyecto
Desarrollado para el proyecto formativo de **Reconocimiento con Inteligencia Artificial - FLOCI**.