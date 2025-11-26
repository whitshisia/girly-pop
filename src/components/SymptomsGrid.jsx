import { useState, useEffect } from 'react';
import symptomsData from '../data/symptoms.json';

export default function SymptomsGrid({ selectedSymptoms = [], onSymptomToggle, compact = false }) {
  const [symptoms, setSymptoms] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    setSymptoms(symptomsData.symptoms);
  }, []);

  const categories = ['all', ...new Set(symptoms.map(s => s.category))];

  const filteredSymptoms = selectedCategory === 'all' 
    ? symptoms 
    : symptoms.filter(s => s.category === selectedCategory);

  const popularSymptoms = symptoms.filter(s => s.popular);

  if (compact) {
    return (
      <div className="symptoms-grid-compact">
        <h4>Common Symptoms</h4>
        <div className="symptoms-list">
          {popularSymptoms.slice(0, 8).map(symptom => (
            <button
              key={symptom.id}
              className={`symptom-chip ${selectedSymptoms.includes(symptom.id) ? 'selected' : ''}`}
              onClick={() => onSymptomToggle(symptom.id)}
            >
              {symptom.emoji} {symptom.name}
            </button>
          ))}
        </div>
        <a href={`/log/${new Date().toISOString().split('T')[0]}`} className="see-all-link">
          See all symptoms →
        </a>
      </div>
    );
  }

  return (
    <div className="symptoms-grid">
      <div className="symptoms-categories">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category === 'all' ? 'All' : category}
          </button>
        ))}
      </div>

      <div className="symptoms-list-full">
        {filteredSymptoms.map(symptom => (
          <div key={symptom.id} className="symptom-item">
            <button
              className={`symptom-btn ${selectedSymptoms.includes(symptom.id) ? 'selected' : ''}`}
              onClick={() => onSymptomToggle(symptom.id)}
            >
              <span className="symptom-emoji">{symptom.emoji}</span>
              <span className="symptom-name">{symptom.name}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}