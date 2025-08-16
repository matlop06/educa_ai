const { FaissStore } = require("@langchain/community/vectorstores/faiss");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');

const VECTOR_STORE_DIR = path.resolve(__dirname, '..', '..', 'vector_stores');

// Función para asegurar que el directorio exista
const ensureDirExists = async (dirPath) => {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
};

// Función para cargar y procesar el documento
const createVectorStore = async (filePath, assistantId) => {
    try {
        await ensureDirExists(VECTOR_STORE_DIR);

        // 1. Cargar el documento
        const dataBuffer = await fs.readFile(filePath);
        let text;
        if (path.extname(filePath).toLowerCase() === '.pdf') {
            const data = await pdf(dataBuffer);
            text = data.text;
        } else {
            text = dataBuffer.toString('utf-8');
        }

        // 2. Dividir el texto en chunks
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const docs = await splitter.createDocuments([text]);

        // 3. Crear embeddings
        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GEMINI_API_KEY,
            model: "embedding-001",
        });

        // 4. Crear y guardar la tienda de vectores
        const vectorStore = await FaissStore.fromDocuments(docs, embeddings);
        const storePath = path.join(VECTOR_STORE_DIR, assistantId);
        await vectorStore.save(storePath);

        // Eliminar el archivo temporal subido
        await fs.unlink(filePath);

        return path.join('vector_stores', assistantId); // Devolver ruta relativa
    } catch (error) {
        console.error("Error creando la tienda de vectores:", error);
        throw new Error("No se pudo procesar el documento.");
    }
};

// Función para añadir documentos a una tienda existente
const addToVectorStore = async (filePath, storePath) => {
    try {
        const absoluteStorePath = path.resolve(__dirname, '..', '..', storePath);

        // 1. Cargar la tienda de vectores existente
        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GEMINI_API_KEY,
            model: "embedding-001",
        });
        const vectorStore = await FaissStore.load(absoluteStorePath, embeddings);

        // 2. Cargar y procesar el nuevo documento
        const dataBuffer = await fs.readFile(filePath);
        let text;
        if (path.extname(filePath).toLowerCase() === '.pdf') {
            const data = await pdf(dataBuffer);
            text = data.text;
        } else {
            text = dataBuffer.toString('utf-8');
        }
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const docs = await splitter.createDocuments([text]);

        // 3. Añadir los nuevos documentos a la tienda
        await vectorStore.addDocuments(docs);

        // 4. Guardar la tienda actualizada
        await vectorStore.save(absoluteStorePath);

        // 5. Eliminar el archivo temporal subido
        await fs.unlink(filePath);

    } catch (error) {
        console.error("Error añadiendo al a la tienda de vectores:", error);
        throw new Error("No se pudo actualizar el documento de conocimiento.");
    }
};

module.exports = { createVectorStore, addToVectorStore };
