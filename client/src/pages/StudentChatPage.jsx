import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAssistantById } from '../services/api';
import io from 'socket.io-client';
import showdown from 'showdown';
import styles from './Chat.module.css';
import Spinner from '../components/Spinner';
import EvaluationAction from '../components/EvaluationAction';
import EvaluationQuestion from '../components/EvaluationQuestion';
import EvaluationContinuation from '../components/EvaluationContinuation';

const StudentChatPage = () => {
  const { assistantId } = useParams();
  const [assistant, setAssistant] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [evaluationContext, setEvaluationContext] = useState(null); // State for evaluation mode

  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const converter = new showdown.Converter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const fetchAssistant = async () => {
      try {
        const response = await getAssistantById(assistantId);
        setAssistant(response.data);
        setMessages([{ role: 'model', parts: [{ text: response.data.welcomeMessage || `Hola, soy ${response.data.name}. ¿En qué puedo ayudarte?` }] }]);
      } catch (error) {
        console.error('Error fetching assistant:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssistant();

    socketRef.current = io();
    socketRef.current.on('connect', () => console.log('Connected to chat server'));
    socketRef.current.on('chat message', (data) => {
      setIsTyping(false);
      if (data.type === 'evaluation_action') {
        setMessages(prev => [...prev, { role: 'model', type: 'evaluation_action', payload: data.payload }]);
      } else if (data.type === 'evaluation_question') {
        setMessages(prev => [...prev, { role: 'model', type: 'evaluation_question', payload: data.payload }]);
        setEvaluationContext({ evaluationId: data.payload.evaluationId, questionIndex: data.payload.questionIndex });
      } else if (data.type === 'evaluation_continuation') {
        setMessages(prev => [...prev, { role: 'model', type: 'evaluation_continuation', payload: data.payload }]);
        setEvaluationContext(null); // Pause evaluation context until user decides
      } else if (data.type === 'evaluation_end') {
        setEvaluationContext(null); // Exit evaluation mode completely
      } else {
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: data.response }] }]);
      }
    });
    socketRef.current.on('chat error', (data) => {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: `**Error:** ${data.error}` }] }]);
    });

    return () => socketRef.current.disconnect();
  }, [assistantId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage = { role: 'user', parts: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    let messagePayload = {
        message: input,
        history: messages,
        assistantId: assistant.id,
    };

    // If in evaluation mode, add the context
    if (evaluationContext) {
        messagePayload.evaluationResponse = {
            ...evaluationContext,
            answer: input
        };
    }

    socketRef.current.emit('chat message', messagePayload);
    setInput('');
  };

  const handleStartEvaluation = (evaluation) => {
    console.log('Attempting to start evaluation:', evaluation); // Debugging line
    socketRef.current.emit('chat message', {
      message: `Iniciar evaluación: ${evaluation.title}`,
      history: messages,
      assistantId: assistant.id,
      startEvaluation: true,
      evaluationId: evaluation._id
    });
  };

  const handleAnswer = (answer, { evaluationId, questionIndex }) => {
    const userMessage = { role: 'user', parts: [{ text: answer }] };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    socketRef.current.emit('chat message', {
      message: answer,
      history: messages,
      assistantId: assistant.id,
      evaluationResponse: {
        evaluationId,
        questionIndex,
        answer
      }
    });
    // Clear the input field after sending a specific answer
    setInput('');
  };

  const handleContinueEvaluation = (payload) => {
    socketRef.current.emit('chat message', {
      message: 'Continuar con la siguiente pregunta.',
      history: messages,
      assistantId: assistant.id,
      continueEvaluation: true,
      ...payload
    });
  };

  const handleStopEvaluation = () => {
    setEvaluationContext(null); // Exit evaluation mode
    setMessages(prev => [...prev, { role: 'model', parts: [{ text: 'Entendido. La evaluación ha finalizado. ¿En qué más puedo ayudarte?' }] }]);
  };

  if (loading) {
    return <div className={styles.pageLoader}><Spinner /></div>;
  }

  return (
    <div className={styles.chatLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.brand}>Educa AI</h2>
          {assistant?.course && (
            <div className={styles.courseInfo}>
              <p>{assistant.course.name}</p>
            </div>
          )}
        </div>
        <div className={styles.sidebarContent}>
          <h4 className={styles.evaluationsHeader}>Evaluaciones Disponibles</h4>
          <ul className={styles.evaluationList}>
            {assistant?.evaluations?.map(evaluation => (
              <li key={evaluation._id} className={styles.evaluationCard}>
                <div className={styles.evaluationInfo}>
                  <h5 className={styles.evaluationTitle}>{evaluation.title}</h5>
                  <p className={styles.evaluationDate}>
                    Fecha: {new Date(evaluation.date).toLocaleDateString()}
                  </p>
                </div>
                <button 
                  onClick={() => handleStartEvaluation(evaluation)} 
                  className={styles.startButton}
                >
                  Iniciar Evaluación
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className={styles.chatContainer}>
        <header className={styles.chatHeader}>
          <h1>{assistant ? assistant.name : 'Chat'}</h1>
          <p>{assistant?.institution?.name}</p>
        </header>
        <div className={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <div key={index} className={`${styles.messageWrapper} ${styles[msg.role]}`}>
              <div className={styles.avatar}>
                {msg.role === 'user' ? 'TÚ' : 'IA'}
              </div>
              <div className={styles.messageBubble}>
                {msg.type === 'evaluation_action' ? (
                  <EvaluationAction payload={msg.payload} onStart={handleStartEvaluation} />
                ) : msg.type === 'evaluation_question' ? (
                  <EvaluationQuestion question={msg.payload.question} onAnswer={(answer) => handleAnswer(answer, msg.payload)} />
                ) : msg.type === 'evaluation_continuation' ? (
                  <EvaluationContinuation
                    onContinue={() => handleContinueEvaluation(msg.payload)}
                    onStop={handleStopEvaluation}
                    isRetry={msg.payload.isRetry}
                  />
                ) : (
                  <div
                    className={styles.messageContent}
                    dangerouslySetInnerHTML={{ __html: converter.makeHtml(msg.parts[0].text) }} 
                  />
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className={`${styles.messageWrapper} ${styles.model}`}>
              <div className={styles.avatar}>IA</div>
              <div className={styles.messageBubble}>
                <div className={styles.typingIndicator}>
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <footer className={styles.inputContainer}>
          <form className={styles.inputForm} onSubmit={sendMessage}>
            <input
              type="text"
              className={styles.chatInput}
              placeholder="Escribe tu pregunta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className={styles.sendButton}>Enviar</button>
          </form>
        </footer>
      </main>
    </div>
  );
};

export default StudentChatPage;
