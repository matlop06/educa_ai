const EvaluationResult = require('../models/EvaluationResult');
const Assistant = require('../models/Assistant');
const mongoose = require('mongoose');

// @desc    Submit an evaluation
// @route   POST /api/evaluations/:evaluationId/submit
// @access  Private (Student)
exports.submitEvaluation = async (req, res) => {
    try {
        const { answers } = req.body;
        const { evaluationId } = req.params;
        const studentId = req.user._id;

        const assistant = await Assistant.findOne({ "evaluations._id": evaluationId });
        if (!assistant) {
            return res.status(404).json({ message: 'Evaluación no encontrada.' });
        }

        const evaluation = assistant.evaluations.id(evaluationId);
        let score = 0;
        const detailedAnswers = evaluation.questions.map(question => {
            const studentAnswer = answers[question._id.toString()];
            const isCorrect = studentAnswer === question.correctAnswer;
            if (isCorrect) {
                score++;
            }
            return {
                question: question._id,
                answer: studentAnswer,
                isCorrect
            };
        });

        const result = new EvaluationResult({
            evaluation: evaluationId,
            student: studentId,
            answers: detailedAnswers,
            score,
            totalQuestions: evaluation.questions.length
        });

        await result.save();

        res.status(201).json({
            message: 'Evaluación enviada con éxito.',
            resultId: result._id
        });

    } catch (error) {
        console.error('Error al enviar la evaluación:', error);
        res.status(500).json({ message: 'Error del servidor.' });
    }
};

// @desc    Get evaluation results
// @route   GET /api/evaluations/results/:resultId
// @access  Private (Student)
exports.getEvaluationResult = async (req, res) => {
    try {
        const { resultId } = req.params;
        const result = await EvaluationResult.findById(resultId)
            .populate({
                path: 'evaluation',
                model: 'Assistant',
                select: 'evaluations'
            })
            .populate('student', 'name');

        if (!result) {
            return res.status(404).json({ message: 'Resultados no encontrados.' });
        }

        if (result.student._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No autorizado.' });
        }

        const assistant = await Assistant.findOne({ "evaluations._id": result.evaluation._id });
        const evaluation = assistant.evaluations.id(result.evaluation._id);

        const populatedResult = {
            ...result.toObject(),
            evaluation: evaluation
        };

        res.status(200).json(populatedResult);

    } catch (error) {
        console.error('Error al obtener los resultados:', error);
        res.status(500).json({ message: 'Error del servidor.' });
    }
};
