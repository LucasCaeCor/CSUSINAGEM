import React, { useState, useEffect } from 'react';


const UnderConstruction = () => {
  const [days, setDays] = useState(15);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (seconds > 0) {
        setSeconds(seconds - 1);
      } else {
        if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          if (hours > 0) {
            setHours(hours - 1);
            setMinutes(59);
            setSeconds(59);
          } else {
            if (days > 0) {
              setDays(days - 1);
              setHours(23);
              setMinutes(59);
              setSeconds(59);
            } else {
              clearInterval(interval);
            }
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [days, hours, minutes, seconds]);

  return (
    <div className="construction-container">
      <div className="construction-content">
        <div className="construction-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2"/>
          </svg>
        </div>
        <h1>LANÇAMENTO EM BREVE</h1>
        <p>Estamos preparando algo incrível para você!</p>
        
        <div className="countdown">
          <div className="countdown-item">
            <span>{days}</span>
            <small>Dias</small>
          </div>
          <div className="countdown-item">
            <span>{hours}</span>
            <small>Horas</small>
          </div>
          <div className="countdown-item">
            <span>{minutes}</span>
            <small>Minutos</small>
          </div>
          <div className="countdown-item">
            <span>{seconds}</span>
            <small>Segundos</small>
          </div>
        </div>
        
        <div className="newsletter">
          <p>Quer ser avisado quando lançarmos?</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Seu melhor email" />
            <button>Me avise!</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnderConstruction;