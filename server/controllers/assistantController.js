const Assistant = require('../models/Assistant');
const User = require('../models/User');
const Course = require('../models/Course');
const Interaction = require('../models/Interaction');
const { createVectorStore, addToVectorStore } = require('../services/ragService');
const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Generate an evaluation summary using AI
// @route   POST /api/assistants/generate-summary
// @access  Public
exports.generateEvaluationSummary = async (req, res) => {
    try {
        const { assistantId, evaluationTitle } = req.body;
        const assistant = await Assistant.findById(assistantId);

        if (!assistant) {
            return res.status(404).json({ error: 'Asistente no encontrado.' });
        }

        const prompt = `
            Actúa como un profesor experto. Basado en el contenido de un asistente de IA llamado "${assistant.name}", genera un resumen conciso y claro de los temas clave que se cubrirán en una evaluación titulada "${evaluationTitle}".
            El resumen debe ser fácil de entender para un estudiante que se prepara para la evaluación.
            Tu respuesta DEBE ser un objeto JSON válido y nada más.
            El objeto JSON debe tener una única propiedad:
            1. "summary": Un string con el resumen en formato Markdown.

            Ejemplo de formato de respuesta:
            {
              "summary": "### Puntos Clave para la Evaluación: ${evaluationTitle}\\n\\n*   **Concepto A**: Definición y características principales.\\n*   **Concepto B**: Diferencias con el Concepto C.\\n*   **Fórmula Clave**: Recuerda la fórmula X = Y * Z."
            }
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonResponse = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

        res.json(jsonResponse);

    } catch (error) {
        console.error("Error generating evaluation summary:", error);
        res.status(500).json({ error: 'Error al generar el resumen de la evaluación.' });
    }
};

// @desc    Generate an evaluation draft using AI
// @route   POST /api/assistants/generate-evaluation-draft
// @access  Private (Professor or higher)
exports.generateEvaluationDraft = async (req, res) => {
    try {
        const { assistantId, title } = req.body;
        const assistant = await Assistant.findById(assistantId).populate('course');

        if (!assistant) {
            return res.status(404).json({ error: 'Asistente no encontrado.' });
        }

        const courseLevel = assistant.course ? assistant.course.name : 'general';

        const prompt = `
            Actúa como un profesor experto. Basado en el asistente llamado "${assistant.name}" y el título de la evaluación "${title}" para un curso de nivel "${courseLevel}", genera un borrador de evaluación.
            Tu respuesta DEBE ser un objeto JSON válido y nada más.
            El objeto JSON debe tener una única propiedad:
            1. "questions": Un array de 5 objetos, donde cada objeto representa una pregunta y tiene las siguientes propiedades:
               - "text": El texto de la pregunta (string).
               - "options": Un array de 4 strings con las posibles respuestas (solo para preguntas de opción múltiple).
               - "correctAnswer": El texto de la respuesta correcta (string).

            Ejemplo de formato de respuesta:
            {
              "questions": [
                {
                  "text": "¿Cuál es la capital de Francia?",
                  "options": ["Londres", "Berlín", "París", "Madrid"],
                  "correctAnswer": "París"
                },
                {
                  "text": "Explica brevemente la fotosíntesis.",
                  "options": [],
                  "correctAnswer": "Es el proceso mediante el cual las plantas convierten la luz solar en energía."
                }
              ]
            }
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean and parse the JSON response
        const jsonResponse = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

        res.json(jsonResponse);

    } catch (error) {
        console.error("Error generating evaluation draft:", error);
        res.status(500).json({ error: 'Error al generar el borrador de la evaluación.' });
    }
};


// @desc    Get all assistants based on user role
// @route   GET /api/assistants
// @access  Private (Professor or higher)
exports.getAssistants = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'super-admin') {
            query = {};
        } else if (req.user.role === 'admin-institucion') {
            query = { institution: req.user.institution };
        } else {
            query = { user: req.user.id };
        }

        const assistants = await Assistant.find(query)
            .populate('user', 'name')
            .populate('institution', 'name')
            .populate('course', 'name');
            
        const mappedAssistants = assistants.map(a => {
            const assistantObject = a.toObject();
            assistantObject.id = assistantObject._id;
            delete assistantObject._id;
            return assistantObject;
        });
        res.json(mappedAssistants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los asistentes.' });
    }
};

// @desc    Get a single assistant with its evaluations
// @route   GET /api/assistants/:id
// @access  Public (for students to access chat)
exports.getAssistantById = async (req, res) => {
    try {
        const assistant = await Assistant.findById(req.params.id)
            .populate('institution', 'name')
            .populate('evaluations'); // Populate the evaluations

        if (!assistant) {
            return res.status(404).json({ error: 'Asistente no encontrado.' });
        }

        const assistantObject = assistant.toObject();
        assistantObject.id = assistantObject._id;
        delete assistantObject._id;
        
        res.json(assistantObject);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el asistente.' });
    }
};

// @desc    Create a new assistant
// @route   POST /api/assistants
// @access  Private (Professor or higher)
exports.createAssistant = async (req, res) => {
    try {
        const assistantData = { 
            ...req.body,
            user: req.user.id,
            institution: req.user.institution
        };

        const newAssistant = new Assistant(assistantData);
        await newAssistant.save();

        if (req.file) {
            const vectorStorePath = await createVectorStore(req.file.path, newAssistant._id.toString());
            newAssistant.vectorStorePath = vectorStorePath;
            await newAssistant.save();
        }

        res.status(201).json(newAssistant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el asistente.' });
    }
};

// @desc    Update an assistant
// @route   PUT /api/assistants/:id
// @access  Private (Professor or higher)
exports.updateAssistant = async (req, res) => {
    try {
        let assistant = await Assistant.findById(req.params.id);
        if (!assistant) {
            return res.status(404).json({ error: 'Asistente no encontrado.' });
        }

        // Authorization check
        const isOwner = assistant.user.toString() === req.user.id.toString();
        const isSuperAdmin = req.user.role === 'super-admin';
        const isInstitutionAdmin = req.user.role === 'admin-institucion' && assistant.institution.toString() === req.user.institution.toString();

        if (!isOwner && !isSuperAdmin && !isInstitutionAdmin) {
            return res.status(403).json({ error: 'No tienes permiso para editar este asistente.' });
        }

        const { tutoringMode, ...updateData } = req.body;
        const oldCourseId = assistant.course;
        const newCourseId = req.body.course;

        if (!newCourseId) {
            delete updateData.course;
        }

        // Handle course change
        if (oldCourseId && oldCourseId.toString() !== newCourseId) {
            // Remove assistant from old course
            await Course.findByIdAndUpdate(oldCourseId, { $pull: { assistants: assistant._id } });
        }
        if (newCourseId && (!oldCourseId || newCourseId !== oldCourseId.toString())) {
            // Add assistant to new course
            await Course.findByIdAndUpdate(newCourseId, { $addToSet: { assistants: assistant._id } });
        }

        if (req.file) {
            if (assistant.vectorStorePath) {
                await addToVectorStore(req.file.path, assistant.vectorStorePath);
            } else {
                const vectorStorePath = await createVectorStore(req.file.path, assistant._id.toString());
                updateData.vectorStorePath = vectorStorePath;
            }
        }

        assistant = await Assistant.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(assistant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el asistente.' });
    }
};

// @desc    Delete an assistant
// @route   DELETE /api/assistants/:id
// @access  Private (Professor or higher)
exports.deleteAssistant = async (req, res) => {
    try {
        const assistant = await Assistant.findById(req.params.id);
        if (!assistant) {
            return res.status(404).json({ error: 'Asistente no encontrado.' });
        }

        const isOwner = assistant.user.toString() === req.user.id.toString();
        const isSuperAdmin = req.user.role === 'super-admin';
        const isInstitutionAdmin = req.user.role === 'admin-institucion' && assistant.institution.toString() === req.user.institution.toString();

        if (!isOwner && !isSuperAdmin && !isInstitutionAdmin) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este asistente.' });
        }

        if (assistant.vectorStorePath) {
            try {
                const storePath = path.resolve(__dirname, '..', assistant.vectorStorePath);
                await fs.rm(storePath, { recursive: true, force: true });
            } catch (err) {
                console.error("Error al eliminar la tienda de vectores:", err);
            }
        }
        await Assistant.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar el asistente.' });
    }
};

// @desc    Add an evaluation to an assistant
// @route   POST /api/assistants/:id/evaluations
// @access  Private (Professor or higher)
exports.addEvaluation = async (req, res) => {
    try {
        const assistant = await Assistant.findById(req.params.id);
        if (!assistant) {
            return res.status(404).json({ error: 'Asistente no encontrado.' });
        }

        // Authorization check
        const isOwner = assistant.user.toString() === req.user.id.toString();
        const isSuperAdmin = req.user.role === 'super-admin';
        const isInstitutionAdmin = req.user.role === 'admin-institucion' && assistant.institution.toString() === req.user.institution.toString();

        if (!isOwner && !isSuperAdmin && !isInstitutionAdmin) {
            return res.status(403).json({ error: 'No tienes permiso para añadir evaluaciones a este asistente.' });
        }
        
        const { title, date, questions } = req.body;
        
        assistant.evaluations.push({ title, date, questions });
        await assistant.save();
        
        res.status(201).json(assistant.evaluations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al añadir la evaluación.' });
    }
};

// @desc    Update an evaluation for an assistant
// @route   PUT /api/assistants/:id/evaluations/:evalId
// @access  Private (Professor or higher)
exports.updateEvaluation = async (req, res) => {
    try {
        const { title, date, questions } = req.body;
        const assistant = await Assistant.findById(req.params.id);

        if (!assistant) {
            return res.status(404).json({ error: 'Asistente no encontrado.' });
        }

        // Authorization check
        const isOwner = assistant.user.toString() === req.user.id.toString();
        const isSuperAdmin = req.user.role === 'super-admin';
        const isInstitutionAdmin = req.user.role === 'admin-institucion' && assistant.institution.toString() === req.user.institution.toString();

        if (!isOwner && !isSuperAdmin && !isInstitutionAdmin) {
            return res.status(403).json({ error: 'No tienes permiso para editar esta evaluación.' });
        }

        const evaluation = assistant.evaluations.id(req.params.evalId);
        if (!evaluation) {
            return res.status(404).json({ error: 'Evaluación no encontrada.' });
        }

        evaluation.title = title;
        evaluation.date = date;
        evaluation.questions = questions;

        await assistant.save();
        res.json(assistant.evaluations);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar la evaluación.' });
    }
};

// @desc    Delete an evaluation from an assistant
// @route   DELETE /api/assistants/:id/evaluations/:evalId
// @access  Private (Professor or higher)
exports.deleteEvaluation = async (req, res) => {
    try {
        const assistant = await Assistant.findById(req.params.id);
        if (!assistant) {
            return res.status(404).json({ error: 'Asistente no encontrado.' });
        }

        // Authorization check
        const isOwner = assistant.user.toString() === req.user.id.toString();
        const isSuperAdmin = req.user.role === 'super-admin';
        const isInstitutionAdmin = req.user.role === 'admin-institucion' && assistant.institution.toString() === req.user.institution.toString();

        if (!isOwner && !isSuperAdmin && !isInstitutionAdmin) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar evaluaciones de este asistente.' });
        }

        assistant.evaluations.pull({ _id: req.params.evalId });
        await assistant.save();

        res.status(200).json(assistant.evaluations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar la evaluación.' });
    }
};

// @desc    Generate answers for a list of questions
// @route   POST /api/assistants/generate-answers
// @access  Private (Professor or higher)
exports.generateAnswers = async (req, res) => {
    try {
        const { assistantId, questions } = req.body;
        const assistant = await Assistant.findById(assistantId).populate('course');
        if (!assistant) {
            return res.status(404).json({ error: 'Asistente no encontrado.' });
        }

        const courseLevel = assistant.course ? assistant.course.name : 'general';
        const questionsText = questions.map(q => `- ${q}`).join('\n');

        const prompt = `
            Actúa como un profesor experto para un curso de nivel "${courseLevel}".
            Basado en el asistente llamado "${assistant.name}", genera las respuestas correctas para la siguiente lista de preguntas.
            Tu respuesta DEBE ser un objeto JSON válido y nada más.
            El objeto JSON debe tener una única propiedad:
            1. "answers": Un array de strings, donde cada string es la respuesta a la pregunta correspondiente en el mismo orden.

            Preguntas:
            ${questionsText}
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonResponse = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

        res.json(jsonResponse);

    } catch (error) {
        console.error("Error generating answers:", error);
        res.status(500).json({ error: 'Error al generar las respuestas.' });
    }
};
