import './HeroSlider.css';

const HeroSlider = () => {
  return (
    <section className="hero-slider">
      <div className="hero-content">
        <h1 className="hero-title">BỘ SƯU TẬP HÈ 2024</h1>
        <p className="hero-subtitle">Mát Mẻ - Năng Động - Phong Cách</p>
        <button className="hero-btn">KHÁM PHÁ NGAY</button>
      </div>
      {/* Fallback image if dynamic load fails or for simple MVP */}
      <img 
        src="https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1920&auto=format&fit=crop" 
        alt="Hero Banner" 
        className="hero-image"
      />
    </section>
  );
};

export default HeroSlider;
