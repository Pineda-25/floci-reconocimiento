require("dotenv").config();
const express = require("express")
const multer = require("multer")
const path = require("path")

//Cliente que gestiona sevicio AWS
const {
  RekognitionClient,
  DetectLabelsCommand
} = require("@aws-sdk/client-rekognition");

//Opcional (considerarse cuando se realice pruebas de con FLOCI)

//Configuracion del mockp (dato de prueba personalizado)
const {mockClient} = require("aws-sdk-client-mock")
const rekognitionMock = mockClient(RekognitionClient)


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

//Configuracion multer (upload archvios imagen)
const upload = multer({
  storage: multer.memoryStorage()
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

//Iniciamos el servidor web
app.listen(port, () => {
  console.log(`Servidor ejecutandose en http://localhost:${port}`)
})