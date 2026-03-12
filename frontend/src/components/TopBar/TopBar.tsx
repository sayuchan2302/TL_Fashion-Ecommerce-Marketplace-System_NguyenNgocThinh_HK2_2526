import './TopBar.css';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

const messages = [
  "FREESHIP ĐƠN TỪ 200K - ĐỔI TRẢ MIỄN PHÍ 60 NGÀY",
  "TỰ HÀO SẢN XUẤT TẠI VIỆT NAM",
  "SALE UP TO 50% - ĐÓN HÈ RỰC RỠ"
];

const TopBar = () => {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const nextMessage = () => setCurrentMessage((prev) => (prev + 1) % messages.length);
  const prevMessage = () => setCurrentMessage((prev) => (prev - 1 + messages.length) % messages.length);

  return (
    <div className="topbar">
      <div className="topbar-content container">
        <button onClick={prevMessage} className="topbar-nav" aria-label="Previous message">
          <ChevronLeft size={16} />
        </button>
        
        <div className="topbar-message">
          <p>{messages[currentMessage]}</p>
        </div>

        <button onClick={nextMessage} className="topbar-nav" aria-label="Next message">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
