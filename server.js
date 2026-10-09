require("dotenv").config();
const express = require("express")
const multer = require("multer")
const path = require("path")

//Cliente que gestiona sevicio AWS
const {
  RekognitionClient,
  DetectLabelsCommand
} = require("@aws-sdk/client-rekognition");

const {
  TextractClient,
  DetectDocumentTextCommand
} = require("@aws-sdk/client-textract")

//Opcional (considerarse cuando se realice pruebas de con FLOCI)

//Configuracion del mockp (dato de prueba personalizado)
const {mockClient} = require("aws-sdk-client-mock");
const rekognitionMock = mockClient(RekognitionClient)
//configuracion del mock de textract
const textractMock = mockClient(TextractClient)


//DEFINIR LAS RESPUESTA PERSONALIZADA
textractMock.on(DetectDocumentTextCommand).resolves({
  Blocks: [
    { BlockType: "LINE", Text: "floci", Confidence: 99.9 },
    { BlockType: "LINE", Text: "Certificado Aprobado", Confidence: 98.5 }
  ]
})

//Definir la respuesta personalizada
//cuando el cliente detecte evento devolvera... 
rekognitionMock.on(DetectLabelsCommand).resolves({
  Labels: [
    {Name: 'Hombre', Confidence: 99.4 },
    {Name: 'Niño', Confidence: 95.4 },
    {Name: 'Perro', Confidence: 70.5 },
    {Name: 'Mujer', Confidence: 98.3 }
  ]
})
//fin mock

const app = express()
const port = process.env.PORT || 3000

//  Iniciar el servicio reconociminto

const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: 'http://localhost:4566',
  credentials: {
    accessKeyId:process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

const textractClient = new TextractClient({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: 'http://localhost:4566',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
      }
    })

//Configuracion multer para imagenes
const upload = multer({
  storage: multer.memoryStorage()
})

//Configuracion multer para PDFs (maximo 5MB)
const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 Megabytes
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true)
    } else {
      cb(new Error("Solo se permite archvios de formato pdf"))
    }
  }
})

//servicios archivos .html
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())

//Ruta para procesar la imagen
//Verbo --> RUTA --> ACCION --> FUNCION ASINCRONA (solicitud, repsuesta)
app.post('/api/analizar', upload.single('imagen'), async(req, res) => {
  try{
    if (!req.file){
      return res.status(400).json({ error: 'No adjunto una imagen valida'})
    }

    //El buffer de la imagen subida
    const imageBuffer = req.file.buffer


    //configurar el comando para detectar etiquetas (ML machine learning)
    const params = {
      Image: {Bytes: imageBuffer },
      MaxLabels: 10,
      MinConfidence: 75
    }

    //Instanciar el comnado de deteccion
    const command = new DetectLabelsCommand(params)
    const response = await rekognitionClient.send(command)

    //Enviar la repsuesta al front como json
    res.json({
      success: true,
      labels: response.Labels
    })

  }catch(error){
    console.error(`Error en el servidor AWS:`, error)
    res.status(500).json({
      error: 'No se completo el analisis en AWS rekognition',
      details: error.message,
      code: error.name
    })
  }
})

app.post('/api/analizar-documento', uploadPdf.single('documento'), async (req, res) => {
  try {
    if(!req.file) {
      return res.status(400).json({
        error: 'No adjunto un archivo pdf valido'
      })
    }

    //buffer del pdf subido
    const pdfBuffer = req.file.buffer

    //configurar el comando detectdocumenttext
    const params = {
      Document: {
        Bytes: pdfBuffer
      }
    }

    //Enviar al cliente mock
    const command = new DetectDocumentTextCommand(params)
    const response = await textractClient.send(command)
    console.log(JSON.stringify(response, null, 2))

    //enviar respuesta
    res.json({
      success: true,
      blocks: response.Blocks
    })

  } catch (error) {
      console.error(`Error en el servidor AWS Textract:`, error);
      res.status(500).json({
        error: 'No se completo el analisis en AWS Textract',
        details: error.message
      })
    }
})

//Iniciamos el servidor web
app.listen(port, () => {
  console.log(`Servidor ejecutandose en http://localhost:${port}`)
})