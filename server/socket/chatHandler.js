const Assistant = require('../models/Assistant');
const Conversation = require('../models/Conversation');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { FaissStore } = require("@langchain/community/vectorstores/faiss");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function handleEvaluationResponse(socket, data) {
    try {
        const { evaluationResponse, assistantId } = data;
        const { evaluationId, questionIndex, answer } = evaluationResponse;

        // 1. Get necessary data from DB
        const assistant = await Assistant.findById(assistantId).populate('evaluations');
        if (!assistant) return socket.emit('chat error', { error: 'Asistente no encontrado.' });
        const evaluation = assistant.evaluations.id(evaluationId);
        if (!evaluation) return socket.emit('chat error', { error: 'Evaluación no encontrada.' });
        const question = evaluation.questions[questionIndex];
        if (!question) return socket.emit('chat error', { error: 'Pregunta no encontrada.' });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        // --- STEP 1: CLASSIFY THE STUDENT'S ANSWER ---
        const classificationPrompt = `
        Tu tarea es clasificar la respuesta de un estudiante a una pregunta.
        Pregunta: "${question.text}"
        Respuesta esperada: "${question.correctAnswer}"
        Respuesta del estudiante: "${answer}"

        Clasifica la respuesta del estudiante en una de estas tres categorías:
        - Correcta: Si la respuesta es conceptualmente idéntica a la esperada.
        - Parcialmente Correcta: Si entendió la idea principal pero faltaron detalles o hay pequeños errores.
        - Incorrecta: Si la respuesta es errónea, o el estudiante dice "no sé" o similar.

        Responde únicamente con una de las tres categorías. Tu respuesta debe ser solo la palabra "Correcta", "Parcialmente Correcta" o "Incorrecta".
        `;

        const classificationResult = await model.generateContent(classificationPrompt);
        const classificationResponse = await classificationResult.response;
        const classification = classificationResponse.text().trim();

        // --- STEP 2: GENERATE FEEDBACK BASED ON CLASSIFICATION ---
        let feedbackPrompt = '';
        switch (classification) {
            case 'Correcta':
                feedbackPrompt = `
                Rol: Eres un tutor de IA.
                Tarea: Felicita al estudiante por su respuesta correcta a la pregunta.
                Pregunta: "${question.text}"
                Respuesta del estudiante: "${answer}"
                Instrucciones: Confirma que su respuesta es correcta y, si quieres, añade un dato interesante o un refuerzo positivo. Sé breve y motivador.
                Formato: Usa Markdown. Responde en español.
                `;
                break;
            case 'Parcialmente Correcta':
                feedbackPrompt = `
                Rol: Eres un tutor de IA.
                Tarea: Guía al estudiante que dio una respuesta parcialmente correcta.
                Pregunta: "${question.text}"
                Respuesta esperada: "${question.correctAnswer}"
                Respuesta del estudiante: "${answer}"
                Instrucciones:
                1. Empieza reconociendo lo que sí hizo bien.
                2. Explica amablemente qué partes faltaron o fueron imprecisas.
                3. Guíalo hacia la respuesta completa con una pregunta o una pista. No le des la respuesta directamente.
                Formato: Usa Markdown. Responde en español.
                `;
                break;
            case 'Incorrecta':
            default: // Fallback for safety
                feedbackPrompt = `
                Rol: Eres un tutor de IA.
                Tarea: Ayuda a un estudiante que respondió incorrectamente o no supo qué responder.
                Pregunta: "${question.text}"
                Respuesta del estudiante: "${answer}"
                Instrucciones:
                1. No le digas simplemente "estás mal". Anímalo.
                2. Guíalo para que entienda la pregunta.
                3. Dale una pista o hazle una pregunta más simple que lo encamine a la respuesta correcta.
                Formato: Usa Markdown. Responde en español.
                `;
                break;
        }

        const feedbackResult = await model.generateContent(feedbackPrompt);
        const feedbackResponse = await feedbackResult.response;
        const feedbackText = feedbackResponse.text();

        // 4. Send feedback to the student
        socket.emit('chat message', { response: feedbackText });

        // 5. Handle evaluation flow
        const isLastQuestion = questionIndex + 1 >= evaluation.questions.length;
        const isCorrect = classification === 'Correcta';

        if (isLastQuestion && isCorrect) {
            // This is the ONLY case where we end the evaluation automatically.
            const completionMessage = "¡Felicidades! Has completado la evaluación.";
            setTimeout(() => {
                socket.emit('chat message', { response: completionMessage });
                socket.emit('chat message', { type: 'evaluation_end' });
            }, 1000);
        } else {
            // In ALL other cases, we ask the user what to do next.
            const isRetry = !isCorrect;
            const nextActionIndex = isCorrect ? questionIndex + 1 : questionIndex;

            const continuationMessage = {
                type: 'evaluation_continuation',
                payload: {
                    evaluationId: evaluation._id,
                    questionIndex: nextActionIndex,
                    isRetry: isRetry,
                }
            };
            setTimeout(() => socket.emit('chat message', continuationMessage), 1000);
        }

    } catch (error) {
        console.error("Error al procesar la respuesta de la evaluación:", error);
        socket.emit('chat error', { error: 'Hubo un error al procesar tu respuesta.' });
    }
}


const handleChat = async (socket, data) => {
    try {
        const { message, history, assistantId } = data;

        const assistant = await Assistant.findById(assistantId).populate('evaluations');
        if (!assistant) {
            socket.emit('chat error', { error: 'Asistente no encontrado.' });
            return;
        }

        // --- Evaluation Flow Logic ---
        if (data.startEvaluation) {
            const evaluation = assistant.evaluations.id(data.evaluationId);
            if (evaluation && evaluation.questions.length > 0) {
                const firstQuestion = evaluation.questions[0];
                const questionMessage = {
                    type: 'evaluation_question',
                    payload: {
                        question: firstQuestion,
                        evaluationId: evaluation._id,
                        questionIndex: 0
                    }
                };
                socket.emit('chat message', questionMessage);
            }
            return;
        } else if (data.evaluationResponse) {
            return await handleEvaluationResponse(socket, data);
        } else if (data.continueEvaluation) {
            const { evaluationId, questionIndex } = data;
            const evaluation = assistant.evaluations.id(evaluationId);
            if (evaluation && evaluation.questions[questionIndex]) {
                const nextQuestion = evaluation.questions[questionIndex];
                const questionMessage = {
                    type: 'evaluation_question',
                    payload: {
                        question: nextQuestion,
                        evaluationId: evaluation._id,
                        questionIndex: questionIndex
                    }
                };
                socket.emit('chat message', questionMessage);
            }
            return;
        }
        // --- End of Evaluation Flow ---


        // --- Regular Chat Flow ---
        let context = "";
        if (assistant.vectorStorePath) {
            try {
                const storePath = path.resolve(__dirname, '..', assistant.vectorStorePath);
                const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey: process.env.GEMINI_API_KEY, model: "embedding-001" });
                const vectorStore = await FaissStore.load(storePath, embeddings);
                const relevantDocs = await vectorStore.similaritySearch(message, 4);
                context = relevantDocs.map(doc => doc.pageContent).join("\n\n");
            } catch (ragError) {
                console.error("Error durante el proceso RAG:", ragError);
            }
        }

        const institutionContext = assistant.institution ? `Eres un profesor de la institución: ${assistant.institution}.` : '';

        const systemPrompt = `
        Tu rol: ${assistant.instructions}. ${institutionContext}
        Tu estilo de respuesta: ${assistant.style}.

        Base de conocimiento principal (trátala como la verdad absoluta para el plan de estudios del estudiante de tu institución):
        ---
        ${context || "No hay un documento de contexto proporcionado. Responde basándote en tu conocimiento general."} 
        ---

        Responde la siguiente pregunta del estudiante. Si la respuesta está en la base de conocimiento, priorízala. Si no, puedes usar tu conocimiento general pero siempre manteniendo tu rol y estilo.

        **Instrucción de Idioma Crucial:** Responde SIEMPRE en el mismo idioma que la última pregunta del estudiante. Si te hablan en español, responde en español. Si te hablan en inglés, responde en inglés.

        **Instrucciones de formato para tu respuesta:**
        - Utiliza Markdown para formatear tu respuesta.
        - Usa encabezados (ej. \`# Título\", \`## Subtítulo\") para separar los temas principales.
        - Usa listas con viñetas (\`-\") o numeradas (\`1.\") para presentar información de forma ordenada.
        - Usa negritas (\`**texto**\") para resaltar los conceptos clave.
        - Separa los párrafos con saltos de línea para que la respuesta sea fácil de leer.
        `;

        const chatHistory = (history || []).filter(msg => msg.role && msg.parts).map(msg => ({
            role: msg.role,
            parts: msg.parts
        }));

        const fullHistoryForAI = [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Entendido. Actuaré según estas instrucciones y contexto." }] },
            ...chatHistory
        ];

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const chat = model.startChat({
            history: fullHistoryForAI,
        });

        // Check for evaluation trigger
        if (message.toLowerCase().includes('evaluación') && assistant.evaluations.length > 0) {
            const evaluation = assistant.evaluations[0]; // Offer the first available evaluation
            const evaluationMessage = {
                type: 'evaluation_action',
                payload: {
                    text: `He notado que mencionaste las evaluaciones. ¿Te gustaría realizar la evaluación "${evaluation.title}"?`,
                    buttonText: `Iniciar Evaluación: ${evaluation.title}`,
                    assistantId: assistant._id,
                    evaluationId: evaluation._id
                }
            };
            socket.emit('chat message', evaluationMessage);
            return;
        }


        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        // Update conversation history using socket session user
        if (socket.request.user) {
            const updatedHistory = [
                ...chatHistory,
                { role: "user", parts: [{ text: message }] },
                { role: "model", parts: [{ text: text }] }
            ];

            await Conversation.findOneAndUpdate(
                { user: socket.request.user._id, assistant: assistantId },
                { history: updatedHistory },
                { upsert: true, new: true }
            );
        }
        
        socket.emit('chat message', { response: text });

    } catch (error) {
        console.error(error);
        if (error.status === 503) {
            socket.emit('chat error', { error: 'El servicio de IA está sobrecargado en este momento. Por favor, inténtalo de nuevo en unos minutos.' });
        } else {
            socket.emit('chat error', { error: 'No se pudo obtener una respuesta de la IA.' });
        }
    }
};

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('a user connected to chat');
        socket.on('chat message', (data) => {
            handleChat(socket, data);
        });
        socket.on('disconnect', () => {
            console.log('user disconnected from chat');
        });
    });
};
